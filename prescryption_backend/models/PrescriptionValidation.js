// models/PrescriptionValidation.js
const mongoose = require("mongoose");

const PrescriptionValidationSchema = new mongoose.Schema({
  prescriptionId: { type: String, required: true, index: true },
  validatedMeds: { type: Array, required: true }, // medicamentos validados con cobertura y precios
  invoiceData: { type: Object, required: true }, // número de factura, totales, etc.
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("PrescriptionValidation", PrescriptionValidationSchema);
