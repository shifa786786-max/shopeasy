const db = require('./db');

const products = db.prepare('SELECT id, name FROM products').all();
const update = db.prepare('UPDATE products SET image_url = ? WHERE id = ?');

for (const p of products) {
  const text = encodeURIComponent(p.name);
  update.run(`https://placehold.co/400x300/eef0f6/1f2a44.png?text=${text}`, p.id);
}

console.log('Updated images for', products.length, 'products');