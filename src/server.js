const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require('dotenv')

dotenv.config({path:'./config/config.env'})

const cart = require('../routes/cart')

const app = express();

const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

app.use('/',cart)

app.get('/', async (req, res) => {
  res.send({ hello: 'world' })
  
})

 app.listen(PORT,console.log(PORT));





 
