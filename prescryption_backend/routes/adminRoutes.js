const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// protected routes admin only
router.get('/insurances/pending', adminController.getPendingInsurances);
router.patch('/insurances/:insurance_nid/verify',  adminController.verifyInsurance);

module.exports = router;
