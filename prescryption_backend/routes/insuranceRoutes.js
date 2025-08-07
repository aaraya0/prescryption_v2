const express = require('express');
const router = express.Router();
const insuranceController = require('../controllers/insuranceController');
const pharmacyController = require('../controllers/pharmacyController');

// Rutas protegidas para obras sociales verificadas
router.get('/prescriptions', insuranceController.getUsedPrescriptionsByInsurance);
router.get('/profile', insuranceController.getInsuranceProfile); 
router.get("/pr_validation/:prescriptionId", pharmacyController.getValidationData);
module.exports = router;
