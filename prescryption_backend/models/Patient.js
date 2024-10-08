const mongoose = require('mongoose');
const patientSchema = new mongoose.Schema({
    nid: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    surname: { type: String, required: true },
    birth_date: { type: Date, required: true },
    sex: { type: String, required: true },
    insurance_name: { type: String, required: true },
    insurance_plan: { type: String, required: true },
    affiliate_num: { type: String, required: true },
    password: { type: String, required: true },
    mail: { type: String, required: true },
    address: { type: String, required: true }  // Añadir address de Ethereum del paciente
});

module.exports = mongoose.model('Patient', patientSchema);
