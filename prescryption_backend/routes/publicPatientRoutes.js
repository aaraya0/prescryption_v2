const express = require('express');
const { registerPatient, verifyInsurancePreview } = require('../controllers/patientController');

const router = express.Router();

router.post('/register', registerPatient);
router.post('/insurance_preview', verifyInsurancePreview);

module.exports = router;
