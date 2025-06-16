const mongoose = require('mongoose');

console.log('[MODEL] Importando modelo Doctor');

const doctorSchema = new mongoose.Schema({
    nid: { type: String, required: true, unique: true },
    license: { type: String, required: true },
    name: { type: String, required: true },
    surname: { type: String, required: true },
    specialty: { type: String, required: true },
    password: { type: String, required: true },
    mail: { type: String, required: true },
    address: { type: String, required: true },
    privateKey:  { type: String, required: true }
});

module.exports = mongoose.model('Doctor', doctorSchema);
