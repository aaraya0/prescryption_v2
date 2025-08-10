const express = require('express');
const { registerPharmacy, registerPharmacyUser } = require('../controllers/pharmacyController');

const router = express.Router();

router.post('/register', registerPharmacy);

router.post('/users/register', registerPharmacyUser);

module.exports = router;
