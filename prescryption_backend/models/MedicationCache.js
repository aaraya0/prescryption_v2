const mongoose = require("mongoose");

const medicationCacheSchema = new mongoose.Schema(
    {
        genericName: { type: String, required: true, lowercase: true, trim: true },
        activeComponentsList: [{ type: String, lowercase: true, trim: true }], // ✅ Guardar lista de componentes
        brandName: { type: String, required: false, trim: true },
        price: { type: Number, required: true },
        pamiPrice: { type: Number, default: 0 },
        details: {
            laboratory: { type: String, default: "Unknown", trim: true },
            presentation: { type: String, default: "Unknown", trim: true },
            route: { type: String, default: "Unknown", trim: true },
            action: { type: String, default: "Unknown", trim: true },
            origin: { type: String, default: "Unknown", trim: true },
            saleType: { type: String, default: "Unknown", trim: true },
            discountPami: { type: Number, default: 0 }, // ✅ Guardar como número
            unitPrice: { type: Number, default: 0 } // ✅ Guardar correctamente el precio unitario
        }
    },
    { timestamps: true }
);

// 🔍 Índice para evitar duplicados
medicationCacheSchema.index({ genericName: 1, brandName: 1 }, { unique: true });

module.exports = mongoose.model("MedicationCache", medicationCacheSchema);
