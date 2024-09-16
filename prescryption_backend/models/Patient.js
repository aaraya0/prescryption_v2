// models/Patient.js
const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
    nid: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    surname: { type: String, required: true },
    fecha_nacimiento: { type: Date, required: true },
    obra_social: { type: String, required: true },
    plan_os: { type: String, required: true },
    num_afiliado: { type: String, required: true },
    password: { type: String, required: true },
    mail: { type: String, required: true }
});

module.exports = mongoose.model('Patient', patientSchema);
