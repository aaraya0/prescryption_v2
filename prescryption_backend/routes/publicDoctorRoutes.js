const express = require('express');
const { registerDoctor } = require('../controllers/doctorController');

const router = express.Router();

// 📌 Registrar Médico (Ruta Pública)
router.post('/register', registerDoctor);

module.exports = router;
