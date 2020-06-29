const { execute } = require("./execute")
const fetch = require('node-fetch');


// inserting a new cartitem to HASURA + updating inventory 
const HASURA_OPERATION = `
  mutation createCartItem($product_id: uuid!, $new_stock:Int!, $user_id:String, $quantity:Int, $price:Int, $product:String) {
    insert_cart_one(object: {product_id: $product_id, product: $product,user_id: $user_id,quantity: $quantity,price:$price}) {
      id
    }

  update_inventory_by_pk(pk_columns: {product_id: $product_id}, _set: {stock_available: $new_stock}) {
    stock_available
  }
  }
`;
 
const PRODUCTS_INVENTORY_QUERY = `
  query ($product_id:uuid!) {
  inventory_by_pk(product_id: $product_id) {
    product
    stock_available
    price
  }
  } 
`;

const FETCH_CART_QUERY = `query {
  cart {
    id
    product_id
    quantity
 }
 }
 `;

const UPDATING_EXISTING_ITEM = `
  mutation($product_id: uuid!, $new_stock:Int, $quantity:Int,$cart_id:name!) {
    update_cart_by_pk(pk_columns: {id: $cart_id}, _set: {quantity: $quantity}) {
      id
    }
    update_inventory_by_pk(pk_columns: {product_id: $product_id}, _set: {stock_available: $new_stock}) {
      stock_available
    }
  }
  `;

exports.createCartItem = async (req, res) => {
  // get request input

  const { product_id } = req.body.input;

  //getting the current user id
  const user_id = req.body.session_variables['x-hasura-user-id']

  //get the how many want the user
  const quantity = req.body.input.quantity

  const { data: inventory_response, errors: inventory_errors } = await execute({ product_id }, PRODUCTS_INVENTORY_QUERY)

  //inventory check
  const inventory_by_pk = inventory_response.inventory_by_pk
  const price = inventory_by_pk.price
  const product = inventory_by_pk.product
  if (!inventory_by_pk) { return res.status(400).json({ message: "There is no product with this id" }) }
  const stock_available = inventory_by_pk ? inventory_by_pk.stock_available : 0
  if (stock_available <= 0) { return res.status(400).json({ message: "Out of Stock" }) }
  if (stock_available < quantity) { return res.status(400).json({ message: `We only have ${stock_available} left` }) }
  // calculating new stock
  const new_stock = stock_available - quantity
  //checking if item is already in the cart
  const cart_response = await fetch('https://ctorontocigar.herokuapp.com/v1/graphql', {
    method: 'POST', body: JSON.stringify({ query: FETCH_CART_QUERY }), headers: {
      "x-hasura-role": req.body.session_variables['x-hasura-role'],
      "x-hasura-user-id": req.body.session_variables['x-hasura-user-id'],
      "x-hasura-admin-secret": process.env.ADMIN_SECRET,
    }
  })
  const cart_json = await cart_response.json();
  const result = cart_json.data.cart.filter(item => item.product_id === product_id)
  //if item is not in the cart or if item is in the cart
  if (result.length === 0) {
    const { data, errors } = await execute({ product_id, new_stock, user_id, quantity, price, product }, HASURA_OPERATION);

    if (errors) {
      return res.status(400).json(errors[0])
    }
    return res.json({
      ...data.insert_cart_one
    })
  } else {
    const newQuantity = result[0].quantity + 1
    const { data, errors } = await execute({ product_id, cart_id: result[0].id, new_stock, quantity: newQuantity }, UPDATING_EXISTING_ITEM);
    if (errors) {
      return res.status(400).json(errors[0])
    }
    return res.json({
      ...data.update_cart_by_pk
    })
  }

}