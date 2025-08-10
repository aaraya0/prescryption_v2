const mongoose = require('mongoose');

const pharmacyUserSchema = new mongoose.Schema({
    pharmacyNid: { type: String, required: true }, // linked pharmacy
    name: { type: String, required: true }, 
    surname: { type: String, required: true },
    nid: { type: String, required: true }, // user ID
    license: { type: String, required: true }, 
    email: { type: String, required: true, unique: true }, 
    password: { type: String, required: true }, 
    isActive: { type: Boolean, default: true }, 
}, {
    timestamps: true, 
});

module.exports = mongoose.model('PharmacyUser', pharmacyUserSchema);
