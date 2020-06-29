const { execute } = require("./execute")


const UPDATE_CART_ITEM = `
  mutation updateCartItem($id:name!,$quantity:Int!,$new_stock:Int!,$inventory_id:uuid!)
  { 
    update_cart_by_pk(pk_columns: {id: $id}, _set: {quantity: $quantity}) { quantity } 
    update_inventory_by_pk(pk_columns: {product_id: $inventory_id}, _set: {stock_available: $new_stock}) {
    stock_available
  }
  }
  `;

const C_QUERY = `
  query cartquery($id:name!){
    cart_by_pk(id: $id) {
      product_id
      quantity
    }
  }
  `;


const INVENTORY_QUERY = `
  query ($inventory_id:uuid!) {
  inventory_by_pk(product_id: $inventory_id) {
    stock_available
  }
  }
`;


exports.updateCartItem = async (req, res) => {
    // get request input
    const { id, quantity } = req.body.input;
    //getting current cart quantity & product id
    const { data: cart_response, errors: cart_error } = await execute({ id }, C_QUERY);
    const cartQuantity = cart_response.cart_by_pk['quantity'];


    if (cart_response.cart_by_pk === null) { return res.status(400).json({ message: "There is no product in the cart with this id" }) };
    const inventory_id = cart_response.cart_by_pk.product_id;
    //checking inventory how many item we have
    const { data: inventory_response, errors: inventory_errors } = await execute({ inventory_id }, INVENTORY_QUERY);



    const inventory_by_pk = inventory_response.inventory_by_pk;

    let new_stock;
    // getting currently available stock
    const stock_available = inventory_by_pk.stock_available;

    if (quantity > cartQuantity) {
        const needed = quantity - cartQuantity
        if (stock_available < needed) {
            if (stock_available === 0) {
                return res.status(400).json({ message: `we only have ${cartQuantity} ` })
            }
            return res.status(400).json({ message: `we only have ${stock_available} left` })
        } else {
            new_stock = stock_available - needed
        }
    } else {
        new_stock = stock_available + cartQuantity - quantity
    }

    // execute the Hasura operation
    const { data, errors } = await execute({ id, quantity, new_stock, inventory_id }, UPDATE_CART_ITEM);
    // if Hasura operation errors, then throw error
    if (errors) {
        return res.status(400).json(errors[0])
    }

    // success
    return res.json({
        ...data.update_cart_by_pk
    })

}