const express = require('express');
const { registerPatient } = require('../controllers/patientController');

const router = express.Router();

// 📌 Registrar Paciente (Ruta Pública)
router.post('/register', registerPatient);

module.exports = router;
