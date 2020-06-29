const express = require('express')
const router =  express.Router()

const { createCartItem } = require('../controllers/createCartItem')
const { updateCartItem } = require('../controllers/updateCartItem')
const { deleteCartItem } = require('../controllers/deleteCartItem')
const { orderPayment } = require('../controllers/orderPayment')
const { successPayment } = require('../controllers/successPayment')

router.route('/createCartItem').post(createCartItem)
router.route('/updateCartItem').post(updateCartItem)
router.route('/deleteCartItem').post(deleteCartItem)
router.route('/orderPayment').post(orderPayment)
router.route('/successPayment').post(successPayment)

module.exports = router