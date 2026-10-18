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
app.use('/api/cart', require('./routers/cartRoutes'));
app.use('/api/orders', require('./routers/orderRoutes'));
app.use('/api/admin', require('./routers/adminRoutes'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`ShopEasy running on http://localhost:${PORT}`);
});