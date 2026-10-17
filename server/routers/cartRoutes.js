const express = require('express');
const {
  viewCart,
  addToCart,
  updateQuantity,
  removeItem
} = require('../controllers/cartcontroller');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.get('/', viewCart);
router.post('/', addToCart);
router.put('/:productId', updateQuantity);
router.delete('/:productId', removeItem);

module.exports = router;