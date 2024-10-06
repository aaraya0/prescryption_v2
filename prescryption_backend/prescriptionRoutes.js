const express = require('express');
const { issuePrescription, getPresbyDoctorNid, getAllPrescriptions } = require('./prescriptionController');
const router = express.Router();

// Define routes
router.post('/issue_pres', issuePrescription);
router.get('/pr_by_doctor', getPresbyDoctorNid);
router.get('/all_pres', getAllPrescriptions);

module.exports = router;
