const express = require('express');
const { getPresbyDoctorNid } = require('../controllers/doctorController');
const router = express.Router();

router.get('/prescriptions', getPresbyDoctorNid);
module.exports = router;
