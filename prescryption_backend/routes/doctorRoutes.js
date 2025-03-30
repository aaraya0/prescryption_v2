const express = require('express');
const { getPresbyDoctorNid, getPatientByNid } = require('../controllers/doctorController');
const router = express.Router();


router.get('/prescriptions', getPresbyDoctorNid);
router.get('/patients/:nid', getPatientByNid);

module.exports = router;
