const { execute } = require("./execute")
const paypal = require('paypal-rest-sdk');
const fetch = require('node-fetch');
const url = require('url');

//fetching shopping car items from HASURA
const FETCH_CART_QUERY = `query {
    cart {
     price
     product
     quantity
     product_id
   }
   }`;


paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': 'AdRMcrng6rD2ecnNN_jIcgl_f3M7tifX5uxrsVZ_k2t47lWJ72FqE8EI7YJCB6EbnIz_WzeK4lzf04Tb',
    'client_secret': 'EGqYQRul5lH18fobPN4N_MvU_9JnPl_nn23OjaW-SDZAnaJgwREbN4QJLmqc3jFHHlE2_5cY6qeMr-02'
  });

  let userLink = ''
  exports.orderPayment = async (req, res) => {

    // get request input
    const { currency } = req.body.input;
  
    // run some business logic
   const session_variables = req.body.session_variables;

   const cart_response = await fetch('https://ctorontocigar.herokuapp.com/v1/graphql', {method: 'POST', body: JSON.stringify({query: FETCH_CART_QUERY}), headers:{"x-hasura-role":req.body.session_variables['x-hasura-role'],
        "x-hasura-user-id":req.body.session_variables['x-hasura-user-id'],
        "x-hasura-admin-secret":process.env.ADMIN_SECRET,
        } }) 
    const cart_json = await cart_response.json();
    
    // creating shopping cart data
  
    const createCart = (cart) =>  cart.map(item => {
                  return {
                      sku: item.product_id,
                      name: item.product,
                      price: item.price.toFixed(2).toString(),
                      quantity: item.quantity,
                      currency: "USD"
                  }
    })
    const cart = createCart(cart_json.data.cart)
  
   
    // calcualte shopping cart price total with quantity
    let total_price = 0;
    const cartTotal = cart_json.data.cart.forEach((item) => total_price += (item.price * item.quantity));
     const total = total_price.toFixed(2).toString()
    
     //create json object for paypal
     const create_payment_json = {
      "intent": "sale",
      "payer": {
          "payment_method": "paypal"
      },
      "redirect_urls": {
          "return_url": "http://localhost:3000/successPayment",
          "cancel_url": "http://localhost:3000/cancel"
      },
      "transactions": [{
          "item_list": {
              "items": cart
          },
          "amount": {
              "currency": "USD",
              "total": total
          },
          "description": ""
      }]
  };
  // creating a paypal payment
  paypal.payment.create(create_payment_json, function (error, payment) {
    if (error) {
      console.log(error)
        throw error;
    } else {
          for(let i = 0;i < payment.links.length;i++){
          if(payment.links[i].rel === 'approval_url'){
          userLink = payment.links[i].href
          }
        }
    }
  });
  
    // sending back the approval url to the user
       return res.json({
       userLink:userLink
   })  

  
}