const express = require('express');
const { emitirReceta } = require('./prescriptionController');
const router = express.Router();

// Define la ruta para emitir receta
router.post('/emitir_receta', emitirReceta);

module.exports = router;
