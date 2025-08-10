const mongoose = require("mongoose");

const medicationCacheSchema = new mongoose.Schema(
  {
    prescriptionId: { type: String, required: true }, 
    genericName: { type: String, required: true, lowercase: true, trim: true },
    activeComponentsList: [{ type: String, lowercase: true, trim: true }],
    brandName: { type: String, required: false, trim: true },
    price: { type: Number, required: true },
    pamiPrice: { type: Number, default: 0 },
    used: { type: Boolean, default: false }, 
    details: {
      laboratory: { type: String, default: "Unknown", trim: true },
      presentation: { type: String, default: "Unknown", trim: true },
      route: { type: String, default: "Unknown", trim: true },
      action: { type: String, default: "Unknown", trim: true },
      origin: { type: String, default: "Unknown", trim: true },
      saleType: { type: String, default: "Unknown", trim: true },
      discountPami: { type: Number, default: 0 },
      unitPrice: { type: Number, default: 0 }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("MedicationCache", medicationCacheSchema);
