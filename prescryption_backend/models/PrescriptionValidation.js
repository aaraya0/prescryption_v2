const mongoose = require("mongoose");

const PrescriptionValidationSchema = new mongoose.Schema({
  prescriptionId: { type: String, required: true, index: true },
  validatedMeds: { type: Array, required: true }, 
  invoiceData: { type: Object, required: true }, 
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("PrescriptionValidation", PrescriptionValidationSchema);
