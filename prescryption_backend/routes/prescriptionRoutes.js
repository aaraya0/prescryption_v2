const express = require('express');
const { issuePrescription, getAllPrescriptions, searchMedications } = require('../controllers/prescriptionController');

const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

router.post('/issue', issuePrescription);
router.get('/search-medications', searchMedications);
router.get('/all', getAllPrescriptions);

module.exports = router;
