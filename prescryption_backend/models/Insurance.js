// models/Insurance.js
const mongoose = require('mongoose');

const insuranceSchema = new mongoose.Schema({
    nid: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    surname: { type: String, required: true },
    razon_social: { type: String, required: true },
    cuit_os: { type: String, required: true },
    password: { type: String, required: true },
    mail: { type: String, required: true }
});

module.exports = mongoose.model('Insurance', insuranceSchema);
