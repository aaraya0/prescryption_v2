const express = require('express');
const { issuePrescription, getPresbyDoctorNid } = require('./prescriptionController');
const router = express.Router();

// Define routes
router.post('/issue_press', issuePrescription);
router.get('/pr_by_doctor', getPresbyDoctorNid);

module.exports = router;
