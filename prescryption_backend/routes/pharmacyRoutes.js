const express = require('express');
const { resetPharmacyAddress, validatePrescription, generateInvoiceAndMarkUsed, deactivatePharmacyUser, activatePharmacyUser, getAvailablePharmacies, getPresbyPharmacyAddress, getMedicationOptions} = require('../controllers/pharmacyController');
const router = express.Router();

// Ruta para desactivar un usuario
router.patch('/users/:userId/deactivate', deactivatePharmacyUser);
// Ruta para reactivar un usuario
router.patch('/users/:userId/activate', activatePharmacyUser);
router.get('/prescriptions', getPresbyPharmacyAddress);
router.post('/reset_address', resetPharmacyAddress);
router.post('/validate_prescription', validatePrescription);
router.post('/generate_invoice', generateInvoiceAndMarkUsed);
router.get('/available', getAvailablePharmacies);
// router.get('/profile', getUserProfile);
router.get("/medications/search/:prescriptionId", getMedicationOptions)
router.get('/prescriptions', getPresbyPharmacyAddress);


module.exports = router;