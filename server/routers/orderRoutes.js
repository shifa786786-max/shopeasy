const express = require('express');
const {
  placeOrder,
  listOrders,
  getOrder,
  cancelOrder
} = require('../controllers/ordercontroller');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.post('/', placeOrder);
router.get('/', listOrders);
router.get('/:id', getOrder);
router.put('/:id/cancel', cancelOrder);

module.exports = router;