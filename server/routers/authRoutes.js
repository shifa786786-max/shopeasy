const express = require('express');
const { register, login, me, updateProfile } = require('../controllers/authcontroller');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', auth, me);
router.put('/me', auth, updateProfile);

module.exports = router;