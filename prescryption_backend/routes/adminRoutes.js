const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// 🔒 Rutas protegidas solo para admin
router.get('/insurances/pending', adminController.getPendingInsurances);
router.patch('/insurances/:insurance_nid/verify',  adminController.verifyInsurance);

module.exports = router;
