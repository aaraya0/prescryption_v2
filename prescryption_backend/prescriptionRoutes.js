const express = require('express');
const { issuePrescription, getPresbyDoctorNid, getAllPrescriptions, getPresbyPatientAddress, sendPrescriptionToPharmacy } = require('./prescriptionController');
const router = express.Router();

// Define routes
router.post('/issue_pres', issuePrescription);
router.get('/pr_by_doctor', getPresbyDoctorNid);
router.get('/pr_by_patient', getPresbyPatientAddress);
router.get('/all_pres', getAllPrescriptions);
router.get('/pr_to_pharmacy', sendPrescriptionToPharmacy);

module.exports = router;
