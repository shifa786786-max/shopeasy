require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
require('./db');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', require('./routers/authRoutes'));
app.use('/api/products', require('./routers/productRoutes'));
app.use('/api/categories', require('./routers/categoryRoutes'));
app.use('/api/cart', require('./routers/cartRoutes'));
app.use('/api/orders', require('./routers/orderRoutes'));
app.use('/api/admin', require('./routers/adminRoutes'));

// Unknown API route -> JSON 404
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

// Central error handler -> JSON 400 / 500
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`ShopEasy running on http://localhost:${PORT}`);
});