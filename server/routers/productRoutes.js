const express = require('express');
const {
  listProducts,
  getProduct,
  listCategories
} = require('../controllers/productcontroller');

const router = express.Router();

router.get('/categories', listCategories);
router.get('/', listProducts);
router.get('/:id', getProduct);

module.exports = router;