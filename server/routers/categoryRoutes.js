const express = require('express');
const { listCategories } = require('../controllers/productcontroller');
const {
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/admincontroller');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/', listCategories);
router.post('/', auth, adminOnly, createCategory);
router.put('/:id', auth, adminOnly, updateCategory);
router.delete('/:id', auth, adminOnly, deleteCategory);

module.exports = router;