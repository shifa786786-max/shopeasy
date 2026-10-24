const express = require('express');
const {
  listProducts,
  getProduct,
  listCategories
} = require('../controllers/productcontroller');
const {
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/admincontroller');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/categories', listCategories);
router.get('/', listProducts);
router.get('/:id', getProduct);

router.post('/', auth, adminOnly, createProduct);
router.put('/:id', auth, adminOnly, updateProduct);
router.delete('/:id', auth, adminOnly, deleteProduct);

module.exports = router;