const express = require('express');
const router = express.Router();
const insuranceController = require('../controllers/insuranceController');


// Rutas protegidas para obras sociales verificadas
router.get('/prescriptions', insuranceController.getUsedPrescriptionsByInsurance);
router.get('/profile', insuranceController.getInsuranceProfile); 

module.exports = router;
