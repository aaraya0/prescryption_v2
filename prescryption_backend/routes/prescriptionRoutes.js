const express = require('express');
const { issuePrescription, getAllPrescriptions } = require('../controllers/prescriptionController');

const router = express.Router();

router.post('/issue', issuePrescription);
router.get('/all', getAllPrescriptions);

module.exports = router;
