const express = require('express');
const { getPharmacyProfile, deactivatePharmacyUser, activatePharmacyUser,  getPharmacyUsers} = require('../controllers/pharmacyController');
const router = express.Router();



// Ruta para desactivar un usuario
router.patch('/users/:userId/deactivate', deactivatePharmacyUser);
// Ruta para reactivar un usuario
router.patch('/users/:userId/activate', activatePharmacyUser);

router.get('/users', getPharmacyUsers);
router.get('/pharmacy_profile', getPharmacyProfile);


module.exports = router;