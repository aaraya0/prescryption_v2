const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// 🟢 Login público
router.post('/login', adminController.loginAdmin);


module.exports = router;
