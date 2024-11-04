const express = require('express');
const { issuePrescription, getPresbyDoctorNid, getAllPrescriptions, 
    getPresbyPatientAddress, sendPrescriptionToPharmacy, getPresbyPharmacyAddress, 
    validatePrescription, generateInvoiceAndMarkUsed, getUserProfile, getPatientByNID, resetPharmacyAddress   } = require('./prescriptionController');
const router = express.Router();

// Define routes
router.post('/issue_pres', issuePrescription);
router.get('/pr_by_doctor', getPresbyDoctorNid);
router.get('/pr_by_patient', getPresbyPatientAddress);
router.get('/all_pres', getAllPrescriptions);
router.get('/pr_by_pharmacy', getPresbyPharmacyAddress);
router.post('/pr_to_pharmacy', sendPrescriptionToPharmacy);
router.post('/pr_validate', validatePrescription);
router.post('/pr_invoice', generateInvoiceAndMarkUsed);
router.get('/user/profile', getUserProfile);
router.get('/patient/:nid', getPatientByNID);
router.post('/address_reset', resetPharmacyAddress );


module.exports = router;
