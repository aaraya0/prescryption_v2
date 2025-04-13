const mongoose = require('mongoose');

const insuranceSchema = new mongoose.Schema({
    insurance_name: { type: String, required: true },
    insurance_nid: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    mail: {
        type: String,
        required: true,
        match: [/.+\@.+\..+/, "❌ Invalid email format"]
    },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Insurance', insuranceSchema);
