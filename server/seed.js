const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const db = require('./db');

const count = db.prepare('SELECT COUNT(*) AS c FROM products').get().c;
if (count > 0) {
  console.log('Seed already done.');
  process.exit(0);
}

const seedSql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
db.exec(seedSql);

const hash = bcrypt.hashSync('Admin@123', 10);
db.prepare(
  "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'admin')"
).run('Admin', 'admin@shopeasy.com', hash);

console.log('Seed complete.');