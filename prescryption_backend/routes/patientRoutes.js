const express = require('express');
const { getPresbyPatientAddress, sendPrescriptionToPharmacy, getPatientProfile, getAvailablePharmacies } = require('../controllers/patientController');
const router = express.Router();




router.get('/prescriptions', getPresbyPatientAddress);
router.post('/send_prescription', sendPrescriptionToPharmacy);
router.get('/profile', getPatientProfile);
router.get('/available', getAvailablePharmacies);


module.exports = router;
