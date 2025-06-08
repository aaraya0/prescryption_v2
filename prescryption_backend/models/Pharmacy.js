const mongoose = require('mongoose');

const pharmacySchema = new mongoose.Schema({
    nid: { type: String, required: true, unique: true },
    pharmacy_name: { type: String, required: true },
    password: { type: String, required: true },
    mail: { type: String, required: true },
    address: { type: String, required: true },
    privateKey: { type: String, required: true }, // 👈 nuevo campo
    physicalAddress: { type: String, required: true },
    contactInfo: { type: String },
    isActive: { type: Boolean, default: true },
    verificationCode: { type: String, required: true } // Código único de registro
}, {
    timestamps: true,
});

module.exports = mongoose.model('Pharmacy', pharmacySchema);
