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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`ShopEasy running on http://localhost:${PORT}`);
});