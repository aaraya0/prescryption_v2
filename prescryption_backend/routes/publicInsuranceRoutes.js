const express = require('express');
const router = express.Router();
const insuranceController = require('../controllers/insuranceController');

// Rutas públicas
router.post('/register', insuranceController.registerInsurance);
router.post('/login', insuranceController.loginInsurance);


module.exports = router;
