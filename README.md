
HASURA-NODE_EXPRESS

This repo contains an express server which was deployed with heroku. When we hit one of the following route: createCartITem, orderPayment, deleteCartItem, successPayment, updateCartItem a communication occur between this express server and HASURA realtime Graphql API. Purpose of this express server to perform some business logic when the client hitting these endpoints, update HASURA tables depending on what changes was sent from the clientside.

More info about HASURA: https://hasura.io/blog/what-is-hasura-ce3b5c6e80e8/