const bcrypt = require('bcrypt');
const axios = require('axios');
const Doctor = require('../models/Doctor');
const blockchainService = require('../services/blockchainService');
const { Web3 } = require('web3');
const { encrypt } = require('../utils/encryption');
const fundNewAccount = require('../utils/fundAccount');
const validateDoctorCordoba = require('../utils/validateDoctor_cba');
const { verifyLicense, verifyLicenseToken } = require("../utils/serviceUrls");
// web 3 config
const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:7545"));


const Patient = require('../models/Patient');

exports.registerDoctor = async (req, res) => {
    const { nid, license, name, surname, specialty, password, mail } = req.body;

    try {
        if (!nid || !license || !name || !surname || !specialty || !password || !mail) {
            return res.status(400).send('❌ Missing required fields');
        }


        let isValid = false;

        // Colegio Médico de Córdoba (if it applies)
        const cordobaResult = await validateDoctorCordoba(nid, license);
        if (cordobaResult.valid) {
            console.log("✅ Validación exitosa vía Colegio Médico de Córdoba.");
            isValid = true;
        } else {
            console.warn("⚠️ No se pudo validar en Córdoba. Intentando fallback al mock...");
        }

        // Fallback to mock
        if (!isValid) {
            const verifyResponse = await axios.post(verifyLicense.url('/verify'), {
                nid,
                license,
                user_type: "doctor"
            }, {
                headers: { Authorization:`Bearer ${verifyLicenseToken}` }
            });

            if (verifyResponse.data.valid) {
                console.log("✅ Validación exitosa vía servicio mock.");
                isValid = true;
            }
        }

        if (!isValid) {
            return res.status(400).send('❌ No se pudo validar la matrícula del médico');
        }


        const hashedPassword = await bcrypt.hash(password, 10);
        const account = web3.eth.accounts.create();
        const encryptedPrivateKey = encrypt(account.privateKey);

        await fundNewAccount(account.address);
        const newDoctor = new Doctor({
            nid,
            license,
            name,
            surname,
            specialty,
            password: hashedPassword,
            mail,
            address: account.address,
            privateKey: encryptedPrivateKey
        });

        await newDoctor.save();
        res.status(201).send('✅ Doctor registered successfully.');
    } catch (err) {
        console.error('❌ Error registering doctor:', err.message);
        res.status(500).send('Error registering doctor');
    }
};


exports.getPresbyDoctorNid = async (req, res) => {
    try {
        const prescriptions = await blockchainService.getPrescriptionsByDoctor(req.user.nid);
        res.json(prescriptions);
    } catch (err) {
        res.status(500).send(err.message);
    }
};


exports.getPatientByNid = async (req, res) => {
    const { nid } = req.params;
    
    try {
      const patient = await Patient.findOne({ nid });
      if (!patient) {
        return res.status(404).json({ message: 'Paciente no encontrado' });
      }
  
      res.json({ profile: patient });
    } catch (error) {
      console.error('❌ Error al buscar paciente:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  };

exports.getDoctorProfile = async (req, res) => {
    try {
        const nid = req.user.nid;
      const doctor = await Doctor.findOne({ nid }).select('-password'); // exclude pw

        if (!doctor) {
            return res.status(404).json({ message: 'Doctor no encontrado' });
        }

        res.json(doctor);
    } catch (error) {
        console.error('❌ Error al obtener perfil del doctor:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};
