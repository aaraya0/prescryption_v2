const express = require('express');
const { getPharmacyProfile, deactivatePharmacyUser, activatePharmacyUser,  getPharmacyUsers} = require('../controllers/pharmacyController');
const router = express.Router();

router.patch('/users/:userId/deactivate', deactivatePharmacyUser);
router.patch('/users/:userId/activate', activatePharmacyUser);

router.get('/users', getPharmacyUsers);
router.get('/pharmacy_profile', getPharmacyProfile);


module.exports = router;