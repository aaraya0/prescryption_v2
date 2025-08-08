const express = require("express");
const {
  resetPharmacyAddress,
  validatePrescription,
  processPurchase,
  getAvailablePharmacies,
  getPresbyPharmacyAddress,
  getMedicationOptions,
  cancelPrescriptionValidation,
  getPharmacyUserProfile,
  getValidationData
} = require("../controllers/pharmacyController");
const router = express.Router();

router.get("/prescriptions", getPresbyPharmacyAddress);
router.post("/reset_address", resetPharmacyAddress);
router.post("/validate_prescription", validatePrescription);
router.post("/process_purchase", processPurchase);
router.get("/available", getAvailablePharmacies);
router.get("/medications/search/:prescriptionId", getMedicationOptions);
router.post("/cancel_validation", cancelPrescriptionValidation);
router.get("/profile", getPharmacyUserProfile);
router.get("/pr_validation/:prescriptionId", getValidationData);

module.exports = router;
