const express = require('express');
const { issuePrescription, getAllPrescriptions } = require('../controllers/prescriptionController');

const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');


router.post('/issue', issuePrescription);
router.get('/all', getAllPrescriptions);

module.exports = router;
