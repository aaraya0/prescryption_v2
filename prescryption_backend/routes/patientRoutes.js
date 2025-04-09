const express = require('express');
const { getPresbyPatientAddress, sendPrescriptionToPharmacy, getPatientProfile } = require('../controllers/patientController');
const router = express.Router();




router.get('/prescriptions', getPresbyPatientAddress);
router.post('/send_prescription', sendPrescriptionToPharmacy);
router.get('/profile', getPatientProfile);


module.exports = router;
