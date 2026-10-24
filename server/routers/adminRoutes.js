const express = require('express');
const c = require('../controllers/admincontroller');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.use(auth, adminOnly);

router.get('/stats', c.stats);

router.get('/products', c.listProducts);
router.post('/products', c.createProduct);
router.put('/products/:id', c.updateProduct);
router.delete('/products/:id', c.deleteProduct);

router.post('/categories', c.createCategory);
router.put('/categories/:id', c.updateCategory);
router.delete('/categories/:id', c.deleteCategory);

router.get('/orders', c.listOrders);
router.put('/orders/:id/status', c.updateOrderStatus);
router.patch('/orders/:id/status', c.updateOrderStatus);

module.exports = router;