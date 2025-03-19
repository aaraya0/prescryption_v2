const mongoose = require('mongoose');

const insuranceSchema = new mongoose.Schema({
    insurance_name: { type: String, required: true },
    insurance_nid: { type: String, required: true },
    password: { type: String, required: true },
    mail: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }

});

module.exports = mongoose.model('Insurance', insuranceSchema);
