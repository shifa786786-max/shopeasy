const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'shopeasy.db'));

const products = db.prepare('SELECT id, name FROM products').all();
const update = db.prepare('UPDATE products SET image_url = ? WHERE id = ?');

for (const p of products) {
  const text = encodeURIComponent(p.name);
  const url = `https://placehold.co/400x300/1e3a8a/ffffff?text=${text}`;
  update.run(url, p.id);
}

console.log('Updated images for', products.length, 'products');