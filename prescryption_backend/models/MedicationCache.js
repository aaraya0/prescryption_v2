const mongoose = require('mongoose');

const medicationCacheSchema = new mongoose.Schema({
    drugName: { type: String, required: true }, // Nombre del medicamento
    results: { type: Array, required: true }, // Lista de opciones con precios
    lastUpdated: { type: Date, default: Date.now } // Última actualización
});

module.exports = mongoose.model('MedicationCache', medicationCacheSchema);
