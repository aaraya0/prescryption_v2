const express = require('express');
const { emitirReceta, obtenerRecetasPorMedico } = require('./prescriptionController');
const router = express.Router();

// Define la ruta para emitir receta
router.post('/emitir_receta', emitirReceta);
router.get('/pr_by_doctor', obtenerRecetasPorMedico);

module.exports = router;
