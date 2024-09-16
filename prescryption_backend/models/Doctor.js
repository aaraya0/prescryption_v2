// models/Doctor.js
const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
    nid: { type: String, required: true, unique: true },
    license: { type: String, required: true },
    name: { type: String, required: true },
    surname: { type: String, required: true },
    specialty: { type: String, required: true },
    password: { type: String, required: true },
    mail: { type: String, required: true }
});

module.exports = mongoose.model('Doctor', doctorSchema);
