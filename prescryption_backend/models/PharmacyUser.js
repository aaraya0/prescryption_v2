const mongoose = require('mongoose');

const pharmacyUserSchema = new mongoose.Schema({
    pharmacyNid: { type: String, required: true }, // NID de la farmacia asociada
    name: { type: String, required: true }, // Nombre del usuario
    surname: { type: String, required: true }, // Apellido del usuario
    nid: { type: String, required: true }, // DNI del usuario
    license: { type: String, required: true }, // Matrícula profesional
    email: { type: String, required: true, unique: true }, // Email
    password: { type: String, required: true }, // Contraseña
    isActive: { type: Boolean, default: true }, // Estado de activación
}, {
    timestamps: true, // Automáticamente agrega `createdAt` y `updatedAt`
});

module.exports = mongoose.model('PharmacyUser', pharmacyUserSchema);
