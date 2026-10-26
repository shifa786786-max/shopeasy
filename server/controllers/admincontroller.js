const db = require('../db');

class AdminError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function fail(err, res, fallback) {
  if (err instanceof AdminError) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error(err);
  return res.status(500).json({ error: fallback });
}

// Admin form me price rupees me aata hai, database me paise me save hota hai
function toPaise(rupees) {
  const n = Number(rupees);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

/* ---------- Products ---------- */

function listProducts(req, res) {
  const products = db
    .prepare(
      `SELECT p.*, c.name AS category_name
       FROM products p
       JOIN categories c ON c.id = p.category_id
       ORDER BY p.id DESC`
    )
    .all();
  res.json({ products });
}

function createProduct(req, res) {
  const { name, description, price, stock, category_id, image_url } = req.body;

  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'Product name is required' });
  }
  const paise = toPaise(price);
  if (paise === null) {
    return res.status(400).json({ error: 'Enter a valid price' });
  }
  const stockNum = Number(stock ?? 0);
  if (!Number.isInteger(stockNum) || stockNum < 0) {
    return res.status(400).json({ error: 'Stock must be 0 or more' });
  }
  const category = db
    .prepare('SELECT id FROM categories WHERE id = ?')
    .get(Number(category_id));
  if (!category) {
    return res.status(400).json({ error: 'Choose a valid category' });
  }

  const result = db
    .prepare(
      `INSERT INTO products (category_id, name, description, price, stock, image_url)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      category.id,
      String(name).trim(),
      description ? String(description).trim() : null,
      paise,
      stockNum,
      image_url || '/images/placeholder.png'
    );

  const product = db
    .prepare('SELECT * FROM products WHERE id = ?')
    .get(result.lastInsertRowid);
  res.status(201).json({ product });
}

function updateProduct(req, res) {
  const existing = db
    .prepare('SELECT * FROM products WHERE id = ?')
    .get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const body = req.body;
  const name = body.name !== undefined ? String(body.name).trim() : existing.name;
  if (!name) {
    return res.status(400).json({ error: 'Product name is required' });
  }

  let price = existing.price;
  if (body.price !== undefined) {
    price = toPaise(body.price);
    if (price === null) {
      return res.status(400).json({ error: 'Enter a valid price' });
    }
  }

  let stock = existing.stock;
  if (body.stock !== undefined) {
    stock = Number(body.stock);
    if (!Number.isInteger(stock) || stock < 0) {
      return res.status(400).json({ error: 'Stock must be 0 or more' });
    }
  }

  let categoryId = existing.category_id;
  if (body.category_id !== undefined) {
    const category = db
      .prepare('SELECT id FROM categories WHERE id = ?')
      .get(Number(body.category_id));
    if (!category) {
      return res.status(400).json({ error: 'Choose a valid category' });
    }
    categoryId = category.id;
  }

  const isActive =
    body.is_active !== undefined ? (body.is_active ? 1 : 0) : existing.is_active;

  db.prepare(
    `UPDATE products
     SET category_id = ?, name = ?, description = ?, price = ?, stock = ?,
         image_url = ?, is_active = ?
     WHERE id = ?`
  ).run(
    categoryId,
    name,
    body.description !== undefined ? body.description : existing.description,
    price,
    stock,
    body.image_url !== undefined ? body.image_url : existing.image_url,
    isActive,
    existing.id
  );

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(existing.id);
  res.json({ product });
}

// Delete = soft delete (is_active = 0), taaki purane orders na tootein
function deleteProduct(req, res) {
  const existing = db
    .prepare('SELECT id FROM products WHERE id = ?')
    .get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Product not found' });
  }

  db.transaction(() => {
    db.prepare('UPDATE products SET is_active = 0 WHERE id = ?').run(existing.id);
    db.prepare('DELETE FROM cart_items WHERE product_id = ?').run(existing.id);
  })();

  res.json({ message: 'Product removed' });
}

/* ---------- Categories ---------- */

function createCategory(req, res) {
  const name = String(req.body.name || '').trim();
  if (!name) {
    return res.status(400).json({ error: 'Category name is required' });
  }
  const exists = db.prepare('SELECT id FROM categories WHERE name = ?').get(name);
  if (exists) {
    return res.status(409).json({ error: 'Category already exists' });
  }
  const result = db.prepare('INSERT INTO categories (name) VALUES (?)').run(name);
  res.status(201).json({ category: { id: Number(result.lastInsertRowid), name } });
}

function updateCategory(req, res) {
  const name = String(req.body.name || '').trim();
  if (!name) {
    return res.status(400).json({ error: 'Category name is required' });
  }
  const existing = db
    .prepare('SELECT id FROM categories WHERE id = ?')
    .get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Category not found' });
  }
  const duplicate = db
    .prepare('SELECT id FROM categories WHERE name = ? AND id != ?')
    .get(name, existing.id);
  if (duplicate) {
    return res.status(409).json({ error: 'Category already exists' });
  }
  db.prepare('UPDATE categories SET name = ? WHERE id = ?').run(name, existing.id);
  res.json({ category: { id: existing.id, name } });
}

function deleteCategory(req, res) {
  const existing = db
    .prepare('SELECT id FROM categories WHERE id = ?')
    .get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Category not found' });
  }
  const used = db
    .prepare('SELECT COUNT(*) AS c FROM products WHERE category_id = ?')
    .get(existing.id).c;
  if (used > 0) {
    return res
      .status(400)
      .json({ error: 'Category has products, move or remove them first' });
  }
  db.prepare('DELETE FROM categories WHERE id = ?').run(existing.id);
  res.json({ message: 'Category deleted' });
}

/* ---------- Orders ---------- */

function listOrders(req, res) {
  const { status } = req.query;
  const params = [];
  let where = '';
  if (status) {
    where = 'WHERE o.status = ?';
    params.push(status);
  }
  const orders = db
    .prepare(
      `SELECT o.id, o.total_amount, o.status, o.created_at,
              o.shipping_name, o.shipping_city, u.name AS customer_name, u.email AS customer_email
       FROM orders o
       JOIN users u ON u.id = o.user_id
       ${where}
       ORDER BY o.id DESC`
    )
    .all(...params);
  res.json({ orders });
}

const NEXT_STATUS = {
  Placed: ['Shipped', 'Cancelled'],
  Shipped: ['Delivered', 'Cancelled'],
  Delivered: [],
  Cancelled: []
};

function updateOrderStatus(req, res) {
  const newStatus = req.body.status;

  const change = db.transaction(() => {
    const order = db
      .prepare('SELECT * FROM orders WHERE id = ?')
      .get(req.params.id);
    if (!order) {
      throw new AdminError(404, 'Order not found');
    }
    if (!NEXT_STATUS[order.status].includes(newStatus)) {
      throw new AdminError(
        400,
        `Cannot change status from ${order.status} to ${newStatus}`
      );
    }

    if (newStatus === 'Cancelled') {
      const items = db
        .prepare('SELECT product_id, quantity FROM order_items WHERE order_id = ?')
        .all(order.id);
      const restore = db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?');
      for (const item of items) {
        restore.run(item.quantity, item.product_id);
      }
    }

    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(newStatus, order.id);
  });

  try {
    change();
    res.json({ message: `Order marked as ${newStatus}` });
  } catch (err) {
    fail(err, res, 'Could not update order');
  }
}

/* ---------- Dashboard ---------- */

function stats(req, res) {
  const totalOrders = db.prepare('SELECT COUNT(*) AS c FROM orders').get().c;
  const revenue = db
    .prepare(
      "SELECT COALESCE(SUM(total_amount), 0) AS s FROM orders WHERE status != 'Cancelled'"
    )
    .get().s;
  const totalProducts = db
    .prepare('SELECT COUNT(*) AS c FROM products WHERE is_active = 1')
    .get().c;
  const totalCustomers = db
    .prepare("SELECT COUNT(*) AS c FROM users WHERE role = 'customer'")
    .get().c;
  const byStatus = db
    .prepare('SELECT status, COUNT(*) AS count FROM orders GROUP BY status')
    .all();
  const lowStock = db
    .prepare(
      `SELECT id, name, stock FROM products
       WHERE is_active = 1 AND stock < 5 ORDER BY stock ASC`
    )
    .all();

  res.json({ totalOrders, revenue, totalProducts, totalCustomers, byStatus, lowStock });
}

module.exports = {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  createCategory,
  updateCategory,
  deleteCategory,
  listOrders,
  updateOrderStatus,
  stats
};