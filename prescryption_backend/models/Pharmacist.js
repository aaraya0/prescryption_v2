// models/Pharmacist.js
const mongoose = require('mongoose');

const pharmacistSchema = new mongoose.Schema({
    nid: { type: String, required: true, unique: true },
    license: { type: String, required: true },
    name: { type: String, required: true },
    surname: { type: String, required: true },
    farmacia: { type: String, required: true },
    cuit_farmacia: { type: String, required: true },
    password: { type: String, required: true },
    mail: { type: String, required: true }
});

module.exports = mongoose.model('Pharmacist', pharmacistSchema);
