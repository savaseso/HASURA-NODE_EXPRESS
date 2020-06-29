const { execute } = require("./execute")
const paypal = require('paypal-rest-sdk');
const fetch = require('node-fetch');


const FETCH_CART_QUERY = `query {
  cart {
   price
   product
   quantity
   product_id
 }
 }`;

const ORDER_MUTATION = `mutation ($object: order_insert_input!) {
  insert_order_one(object: $object) {
    id
  }
  delete_cart(where: {}) {
    affected_rows
  }
}`;

exports.successPayment = async (req, res) => {

  // get request input
  const { payerId, paymentId } = req.body.input;
  const session_variables = req.body.session_variables;

  // fetch call to hasura backend to getting cart items

  const cart_response = await fetch('https://ctorontocigar.herokuapp.com/v1/graphql', {
    method: 'POST', body: JSON.stringify({ query: FETCH_CART_QUERY }), headers: {
      "x-hasura-role": req.body.session_variables['x-hasura-role'],
      "x-hasura-user-id": req.body.session_variables['x-hasura-user-id'],
      "x-hasura-admin-secret": process.env.ADMIN_SECRET,
    }
  })
  const cart_json = await cart_response.json();

  //calculate total price

  let total_price = 0;
  const cartTotal = cart_json.data.cart.forEach((item) => total_price += (item.price * item.quantity));
  const total = total_price.toFixed(2).toString()
  console.log(total, payerId)
  //creating a json object for Paypal
  const execute_payment_json = {
    "payer_id": payerId,
    "transactions": [{
      "amount": {
        "currency": "USD",
        "total": total
      }
    }]
  };
  //execute paypal payment
  paypal.payment.execute(paymentId, execute_payment_json, async function (error, payment) {
    if (error) {
      console.log(error.response);
      throw error;
    } else {
      const payment_info = JSON.stringify(payment)
      const parsed = JSON.parse(payment_info)
      //getting user information from paypal
      const { recipient_name, line1, city, state, postal_code, country_code } = parsed.payer.payer_info.shipping_address
      // find products from cart;
      const cart_products = cart_json.data.cart.map((item) => {
        return { product_id: item.product_id, price: item.price, user_id: req.body.session_variables['x-hasura-user-id'],quantity:item.quantity }
      });
      console.log(cart_json.data.cart)
      // creating an object for Hasura
      const order_object = {
        address_city: city,
        address_country: country_code,
        address_line1: line1,
        address_postal_code: postal_code,
        address_state: state,
        recipient_name,
        user_id: req.body.session_variables['x-hasura-user-id'],
        order_item: {
          data: cart_products
        }
      }
      //posting order information to Hasura

      const order_response = await fetch('https://ctorontocigar.herokuapp.com/v1/graphql', {
        method: 'POST', body: JSON.stringify({ query: ORDER_MUTATION, variables: { object: order_object } }), headers: {
          "x-hasura-role": req.body.session_variables['x-hasura-role'],
          "x-hasura-user-id": req.body.session_variables['x-hasura-user-id'],
          "x-hasura-admin-secret": process.env.ADMIN_SECRET,
        }
      })
      const order_json = await order_response.json();
    }
    // delete cart 

  });
  // success
  return res.json({
    userLink: 'benceee'
  })
};