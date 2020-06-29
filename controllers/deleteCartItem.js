const { execute } = require("./execute")


const DELETE_ITEM = `

 mutation deleteCartItem ($product_id:name!,$inventory_id:uuid!, $new_stock:Int!) {
   delete_cart_by_pk(id: $product_id) {
     id
   }
 
 update_inventory_by_pk(pk_columns: {product_id: $inventory_id}, _set: {stock_available: $new_stock}) {
     stock_available
   }
 }
 `;

const CART_QUERY = `
 
 query ($product_id:name!) {
    cart_by_pk(id: $product_id) {
    product_id
    quantity
    }


}
`

const INVENTORY_QUERY = `

 query ($inventory_id:uuid!) {
    inventory_by_pk(product_id: $inventory_id) {
    stock_available
    }
}
`

exports.deleteCartItem = async (req, res) => {
    // get request input
    const { product_id } = req.body.input;


    // run some business logic


    const { data: cart_response, errors: cart_errors } = await execute({ product_id }, CART_QUERY)
    if (cart_response.cart_by_pk === null) { return res.status(400).json({ message: "There is no product in the cart with this id" }) }

    const inventory_id = cart_response.cart_by_pk.product_id

    const { data: inventory_response, errors: inventory_errors } = await execute({ inventory_id }, INVENTORY_QUERY)


    const inventory_by_pk = inventory_response.inventory_by_pk
    if (!inventory_by_pk) { return res.status(400).json({ message: "There is no product with this id" }) }

    const stock_available = inventory_by_pk.stock_available

    const cart_quantity = cart_response.cart_by_pk.quantity
    const new_stock = stock_available + cart_quantity
    // execute the Hasura operation

    const { data, errors } = await execute({ product_id, inventory_id, new_stock }, DELETE_ITEM);



    // if Hasura operation errors, then throw error
    if (errors) {
        return res.status(400).json(errors[0])
    }
    console.log(data)
    //success
    return res.json({
        item_deleted:true
    })
}