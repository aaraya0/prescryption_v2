const bcrypt = require('bcrypt');
const axios = require('axios');
const Doctor = require('../models/Doctor');
const blockchainService = require('../services/blockchainService');
const { Web3 } = require('web3');

// ✅ Configuración de Web3
const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:7545"));

// 📌 Registrar Médico (Ruta Pública)
exports.registerDoctor = async (req, res) => {
    const { nid, license, name, surname, specialty, password, mail } = req.body;

    try {
        if (!nid || !license || !name || !surname || !specialty || !password || !mail) {
            return res.status(400).send('❌ Missing required fields');
        }

        // ✅ Validar mediante el servicio de verificación
        const verifyResponse = await axios.post('http://localhost:5000/verify', {
            nid,
            license,
            user_type: "doctor"
        }, {
            headers: { Authorization: "Bearer securetoken123" }
        });

        if (!verifyResponse.data.valid) {
            return res.status(400).send('❌ Invalid license or NID');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const account = web3.eth.accounts.create();

        const newDoctor = new Doctor({
            nid,
            license,
            name,
            surname,
            specialty,
            password: hashedPassword,
            mail,
            address: account.address,
            privateKey: account.privateKey
        });

        await newDoctor.save();
        res.status(201).send('✅ Doctor registered successfully.');
    } catch (err) {
        console.error('❌ Error registering doctor:', err.message);
        res.status(500).send('Error registering doctor');
    }
};


// 📌 Obtener Recetas por Médico (Ruta Protegida)
exports.getPresbyDoctorNid = async (req, res) => {
    try {
        const prescriptions = await blockchainService.getPrescriptionsByDoctor(req.user.nid);
        res.json(prescriptions);
    } catch (err) {
        res.status(500).send(err.message);
    }
};
