const express = require('express');
const { getPresbyDoctorNid, getPatientByNid, getDoctorProfile } = require('../controllers/doctorController');
const router = express.Router();


router.get('/prescriptions', getPresbyDoctorNid);
router.get('/patients/:nid', getPatientByNid);
router.get('/profile', getDoctorProfile);

module.exports = router;
