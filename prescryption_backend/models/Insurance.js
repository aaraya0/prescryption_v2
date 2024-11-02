const mongoose = require('mongoose');

const insuranceSchema = new mongoose.Schema({
    nid: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    surname: { type: String, required: true },
    insurance_name: { type: String, required: true },
    insurance_nid: { type: String, required: true },
    password: { type: String, required: true },
    mail: { type: String, required: true },
    address: { type: String, required: true } 
});

module.exports = mongoose.model('Insurance', insuranceSchema);
