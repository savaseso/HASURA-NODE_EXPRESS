const fetch = require("node-fetch")


exports.execute  = async (variables, operation) => {
    const fetchResponse = await fetch(
      "https://ctorontocigar.herokuapp.com/v1/graphql",
      {
        method: 'POST',
        body: JSON.stringify({
          query: operation,
          variables
        }),
       headers: {
        "x-hasura-admin-secret":process.env.ADMIN_SECRET
        }
      
        
      }
      
    );
    const data = await fetchResponse.json();
    //console.log('DEBUGbencu: ', data);
    return data;
  };