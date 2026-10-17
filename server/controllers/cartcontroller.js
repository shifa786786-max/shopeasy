const db = require('../db');

function getCart(userId) {
  const items = db
    .prepare(
      `SELECT ci.product_id, ci.quantity, p.name, p.price, p.stock, p.image_url,
              (ci.quantity * p.price) AS line_total
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       WHERE ci.user_id = ?
       ORDER BY ci.id`
    )
    .all(userId);

  const total = items.reduce((sum, i) => sum + i.line_total, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  return { items, total, count };
}

function viewCart(req, res) {
  res.json(getCart(req.user.id));
}

function addToCart(req, res) {
  const productId = Number(req.body.product_id);
  const qty = Number(req.body.quantity ?? 1);

  if (!Number.isInteger(productId) || !Number.isInteger(qty) || qty < 1) {
    return res.status(400).json({ error: 'Valid product_id and quantity are required' });
  }

  const product = db
    .prepare('SELECT id, stock FROM products WHERE id = ? AND is_active = 1')
    .get(productId);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  if (product.stock < 1) {
    return res.status(400).json({ error: 'Product is out of stock' });
  }

  const existing = db
    .prepare('SELECT quantity FROM cart_items WHERE user_id = ? AND product_id = ?')
    .get(req.user.id, productId);

  const newQty = (existing ? existing.quantity : 0) + qty;
  if (newQty > product.stock) {
    return res.status(400).json({ error: `Only ${product.stock} item(s) in stock` });
  }

  if (existing) {
    db.prepare('UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?')
      .run(newQty, req.user.id, productId);
  } else {
    db.prepare('INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)')
      .run(req.user.id, productId, qty);
  }

  res.status(201).json(getCart(req.user.id));
}

function updateQuantity(req, res) {
  const productId = Number(req.params.productId);
  const qty = Number(req.body.quantity);

  if (!Number.isInteger(productId) || !Number.isInteger(qty) || qty < 1) {
    return res.status(400).json({ error: 'Quantity must be 1 or more' });
  }

  const item = db
    .prepare('SELECT id FROM cart_items WHERE user_id = ? AND product_id = ?')
    .get(req.user.id, productId);
  if (!item) {
    return res.status(404).json({ error: 'Item not in cart' });
  }

  const product = db.prepare('SELECT stock FROM products WHERE id = ?').get(productId);
  if (qty > product.stock) {
    return res.status(400).json({ error: `Only ${product.stock} item(s) in stock` });
  }

  db.prepare('UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?')
    .run(qty, req.user.id, productId);

  res.json(getCart(req.user.id));
}

function removeItem(req, res) {
  const productId = Number(req.params.productId);
  db.prepare('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?')
    .run(req.user.id, productId);
  res.json(getCart(req.user.id));
}

module.exports = { viewCart, addToCart, updateQuantity, removeItem, getCart };