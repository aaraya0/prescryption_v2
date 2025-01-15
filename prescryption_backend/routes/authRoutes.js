const express = require('express');
const { login } = require('../controllers/authController');

const router = express.Router();

// 📌 Login (Acceso Público)
router.post('/login', login);

module.exports = router;
