const express = require('express');
const { issuePrescription, getPresbyDoctorNid, getAllPrescriptions, getPresbyPatientAddress } = require('./prescriptionController');
const router = express.Router();

// Define routes
router.post('/issue_pres', issuePrescription);
router.get('/pr_by_doctor', getPresbyDoctorNid);
router.get('/pr_by_patient', getPresbyPatientAddress);
router.get('/all_pres', getAllPrescriptions);

module.exports = router;
