// models/Pharmacist.js
const mongoose = require('mongoose');

const pharmacySchema = new mongoose.Schema({
    nid: { type: String, required: true, unique: true },
    license: { type: String, required: true },
    name: { type: String, required: true },
    surname: { type: String, required: true },
    pharmacy_name: { type: String, required: true },
    pharmacy_nid: { type: String, required: true },
    password: { type: String, required: true },
    mail: { type: String, required: true },
    alias: {
        type: String,
        unique: true,
        required: true
    }
});

module.exports = mongoose.model('Pharmacy', pharmacySchema);
