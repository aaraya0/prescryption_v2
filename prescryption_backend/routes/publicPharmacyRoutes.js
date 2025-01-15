const express = require('express');
const { registerPharmacy, registerPharmacyUser } = require('../controllers/pharmacyController');

const router = express.Router();

// 📌 Registrar Farmacia (Ruta Pública)
router.post('/register', registerPharmacy);

// 📌 Registrar Usuario de Farmacia (Ruta Pública)
router.post('/users/register', registerPharmacyUser);

module.exports = router;
