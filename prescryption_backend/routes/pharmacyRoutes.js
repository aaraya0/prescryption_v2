const express = require('express');
const { getPresbyPharmacyAddress, sendPrescriptionToPharmacy, resetPharmacyAddress, validatePrescription, generateInvoiceAndMarkUsed, deactivatePharmacyUser, activatePharmacyUser  } = require('../controllers/pharmacyController');
const router = express.Router();

// Ruta para desactivar un usuario
router.patch('/users/:userId/deactivate', deactivatePharmacyUser);
// Ruta para reactivar un usuario
router.patch('/users/:userId/activate', activatePharmacyUser);
router.get('/prescriptions', getPresbyPharmacyAddress);
router.post('/send_prescription', sendPrescriptionToPharmacy);
router.post('/reset_address', resetPharmacyAddress);
router.post('/validate_prescription', validatePrescription);
router.post('/generate_invoice', generateInvoiceAndMarkUsed);
// router.get('/profile', getUserProfile);

module.exports = router;