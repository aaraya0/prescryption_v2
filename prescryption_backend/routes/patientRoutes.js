const express = require('express');
const { getPresbyPatientAddress, sendPrescriptionToPharmacy } = require('../controllers/patientController');
const router = express.Router();




router.get('/prescriptions', getPresbyPatientAddress);
router.post('/send_prescription', sendPrescriptionToPharmacy);

module.exports = router;
