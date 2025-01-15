const bcrypt = require('bcrypt');
const Patient = require('../models/Patient');
const blockchainService = require('../services/blockchainService');
const { Web3 } = require('web3');

const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:7545"));

// 📌 Registrar Paciente (Ruta Pública)
exports.registerPatient = async (req, res) => {
    const { name, surname, nid, birth_date, sex, insurance_name, insurance_plan, affiliate_num, mail, password } = req.body;

    try {
        const existingPatient = await Patient.findOne({ nid });
        if (existingPatient) {
            return res.status(400).send('❌ Patient already registered with this NID.');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const account = web3.eth.accounts.create();

        const newPatient = new Patient({
            name,
            surname,
            nid,
            birth_date,
            sex,
            insurance_name,
            insurance_plan,
            affiliate_num,
            mail,
            password: hashedPassword,
            address: account.address
        });

        await newPatient.save();
        res.status(201).send('✅ Patient registered successfully.');
    } catch (err) {
        console.error('❌ Error registering patient:', err.message);
        res.status(500).send('Error registering patient');
    }
};

// 📌 Obtener Recetas por Paciente (Ruta Protegida)
exports.getPresbyPatientAddress = async (req, res) => {
    try {
        // Obtener el NID del token del usuario autenticado
        const nid = req.user.nid;

        // Buscar al paciente en la base de datos
        const patient = await Patient.findOne({ nid });
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        // Obtener la dirección del paciente
        const patientAddress = patient.address;
        if (!patientAddress) {
            return res.status(400).json({ message: 'Patient address not available' });
        }

        // Consultar las recetas en la blockchain
        const prescriptions = await blockchainService.getPrescriptionsByPatient(patientAddress);
        res.json(prescriptions);
    } catch (err) {
        console.error('Error retrieving prescriptions:', err.message);
        res.status(500).send(err.message);
    }
};

