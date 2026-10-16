const db = require('../db');

function listProducts(req, res) {
  const { search, category, sort, page = 1, limit = 8 } = req.query;

  const conditions = ['p.is_active = 1'];
  const params = [];

  if (search) {
    conditions.push('p.name LIKE ?');
    params.push(`%${search}%`);
  }
  if (category) {
    conditions.push('p.category_id = ?');
    params.push(Number(category));
  }

  const where = conditions.join(' AND ');

  let orderBy = 'p.id DESC';
  if (sort === 'price_asc') orderBy = 'p.price ASC';
  if (sort === 'price_desc') orderBy = 'p.price DESC';

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(50, Math.max(1, Number(limit) || 8));
  const offset = (pageNum - 1) * limitNum;

  const total = db
    .prepare(`SELECT COUNT(*) AS c FROM products p WHERE ${where}`)
    .get(...params).c;

  const products = db
    .prepare(
      `SELECT p.*, c.name AS category_name
       FROM products p
       JOIN categories c ON c.id = p.category_id
       WHERE ${where}
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`
    )
    .all(...params, limitNum, offset);

  res.json({
    products,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum),
    total
  });
}

function getProduct(req, res) {
  const product = db
    .prepare(
      `SELECT p.*, c.name AS category_name
       FROM products p
       JOIN categories c ON c.id = p.category_id
       WHERE p.id = ? AND p.is_active = 1`
    )
    .get(req.params.id);

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json({ product });
}

function listCategories(req, res) {
  const categories = db.prepare('SELECT * FROM categories ORDER BY name').all();
  res.json({ categories });
}

module.exports = { listProducts, getProduct, listCategories };