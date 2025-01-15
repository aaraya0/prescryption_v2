const express = require('express');
const { getPresbyPatientAddress } = require('../controllers/patientController');
const router = express.Router();

router.get('/prescriptions', getPresbyPatientAddress);
module.exports = router;
