const db = require('../db');

class OrderError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function handleError(err, res, fallback) {
  if (err instanceof OrderError) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error(err);
  return res.status(500).json({ error: fallback });
}

function placeOrder(req, res) {
  const { name, phone, address, city, pincode } = req.body;

  if (!name || !phone || !address || !city || !pincode) {
    return res.status(400).json({ error: 'All shipping details are required' });
  }
  if (!/^\d{10}$/.test(String(phone))) {
    return res.status(400).json({ error: 'Phone must be 10 digits' });
  }
  if (!/^\d{6}$/.test(String(pincode))) {
    return res.status(400).json({ error: 'PIN code must be 6 digits' });
  }

  const create = db.transaction(() => {
    const items = db
      .prepare(
        `SELECT ci.product_id, ci.quantity, p.name, p.price, p.stock, p.is_active
         FROM cart_items ci
         JOIN products p ON p.id = ci.product_id
         WHERE ci.user_id = ?`
      )
      .all(req.user.id);

    if (items.length === 0) {
      throw new OrderError(400, 'Your cart is empty');
    }

    let total = 0;
    for (const item of items) {
      if (!item.is_active) {
        throw new OrderError(400, `${item.name} is no longer available`);
      }
      if (item.quantity > item.stock) {
        throw new OrderError(400, `Not enough stock for ${item.name}`);
      }
      total += item.price * item.quantity;
    }

    const result = db
      .prepare(
        `INSERT INTO orders
         (user_id, total_amount, shipping_name, shipping_phone,
          shipping_address, shipping_city, shipping_pincode)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        req.user.id,
        total,
        String(name).trim(),
        String(phone),
        String(address).trim(),
        String(city).trim(),
        String(pincode)
      );
    const orderId = Number(result.lastInsertRowid);

    const insertItem = db.prepare(
      'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)'
    );
    const reduceStock = db.prepare(
      'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?'
    );

    for (const item of items) {
      insertItem.run(orderId, item.product_id, item.quantity, item.price);
      const r = reduceStock.run(item.quantity, item.product_id, item.quantity);
      if (r.changes === 0) {
        throw new OrderError(400, `Not enough stock for ${item.name}`);
      }
    }

    db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.id);

    return { orderId, total };
  });

  try {
    const { orderId, total } = create();
    res.status(201).json({
      message: 'Order placed successfully',
      order_id: orderId,
      total_amount: total
    });
  } catch (err) {
    handleError(err, res, 'Could not place order');
  }
}

function listOrders(req, res) {
  const orders = db
    .prepare(
      `SELECT id, total_amount, status, created_at
       FROM orders WHERE user_id = ? ORDER BY id DESC`
    )
    .all(req.user.id);
  res.json({ orders });
}

function getOrder(req, res) {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);

  if (!order || (order.user_id !== req.user.id && req.user.role !== 'admin')) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const items = db
    .prepare(
      `SELECT oi.product_id, p.name, oi.quantity, oi.unit_price
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = ?`
    )
    .all(order.id);

  res.json({ order, items });
}

function cancelOrder(req, res) {
  const cancel = db.transaction(() => {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);

    if (!order || order.user_id !== req.user.id) {
      throw new OrderError(404, 'Order not found');
    }
    if (order.status !== 'Placed') {
      throw new OrderError(400, 'Only orders with status Placed can be cancelled');
    }

    const items = db
      .prepare('SELECT product_id, quantity FROM order_items WHERE order_id = ?')
      .all(order.id);

    const restore = db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?');
    for (const item of items) {
      restore.run(item.quantity, item.product_id);
    }

    db.prepare("UPDATE orders SET status = 'Cancelled' WHERE id = ?").run(order.id);
  });

  try {
    cancel();
    res.json({ message: 'Order cancelled' });
  } catch (err) {
    handleError(err, res, 'Could not cancel order');
  }
}

module.exports = { placeOrder, listOrders, getOrder, cancelOrder };