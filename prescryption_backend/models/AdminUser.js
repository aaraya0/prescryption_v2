const mongoose = require('mongoose');

const adminUserSchema = new mongoose.Schema({
    nid: { type: String, required: true, unique: true }, // DNI o identificador
    name: { type: String, required: true },
    mail: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: "admin" }
});

module.exports = mongoose.model('AdminUser', adminUserSchema);
