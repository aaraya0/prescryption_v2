const bcrypt = require('bcrypt');
const Patient = require('../models/Patient');
const blockchainService = require('../services/blockchainService');
const Pharmacy = require('../models/Pharmacy');
const { Web3 } = require('web3');
const axios = require('axios');


const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:7545"));





exports.registerPatient = async (req, res) => {
    const { name, surname, nid, birth_date, sex, insurance_name, password, mail } = req.body;

    if (!name || !surname || !nid || !birth_date || !sex || !insurance_name || !password || !mail) {
        return res.status(400).json({ message: "❌ Missing required fields" });
    }

    let affiliate_num = "N/A"; // Valor por defecto para pacientes particulares
    let insurance_plan = "PARTICULAR"; // Plan para pacientes sin obra social

    if (insurance_name && insurance_name !== "PARTICULAR") {
        try {
            // 🔍 Consultar la API de la obra social para obtener afiliación
            const response = await axios.post('http://localhost:5003/get_affiliation', { nid, insurance_name });

            if (response.data.status === "not_found") {
                return res.status(400).json({
                    message: "⚠️ Patient is not affiliated with this insurance. Choose 'PARTICULAR' to continue."
                });
            }

            // Si el paciente está afiliado, usar los datos obtenidos
            affiliate_num = response.data.affiliate_number;
            insurance_plan = response.data.insurance_plan;

        } catch (error) {
            if (error.response && error.response.status === 404) {
                return res.status(400).json({
                    message: "⚠️ Patient is not found in the insurance database. Choose 'PARTICULAR' to continue."
                });
            }
            console.error("❌ Error validating patient:", error.message);
            return res.status(500).json({ message: "Error validating patient" });
        }
    }

    try {
        // 🔐 Hashear la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);
        const account = web3.eth.accounts.create();

        // 📝 Registrar al paciente (ya sea particular o afiliado)
        const newPatient = new Patient({
            name,
            surname,
            nid,
            birth_date,
            sex,
            insurance_name: insurance_name || "PARTICULAR", // Si no tiene obra social, asignar "PARTICULAR"
            affiliate_num,
            insurance_plan,
            mail,
            password: hashedPassword,
            address: account.address
        });

        await newPatient.save();

        res.status(201).json({ message: "✅ Patient registered successfully." });

    } catch (error) {
        console.error("❌ Error registering patient:", error.message);
        res.status(500).json({ message: "Error registering patient" });
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


// 📌 Enviar Receta a Farmacia
exports.sendPrescriptionToPharmacy = async (req, res) => {
    const { prescriptionId, pharmacyNid } = req.body;

    try {
        // Validar que se proporcionen los datos necesarios
        if (!prescriptionId || !pharmacyNid) {
            return res.status(400).json({ message: '❌ Missing required fields' });
        }

        // Buscar la farmacia en la base de datos
        const pharmacy = await Pharmacy.findOne({ nid: pharmacyNid });
        if (!pharmacy) {
            return res.status(404).json({ message: '❌ Pharmacy not found' });
        }

        // Actualizar la receta en la blockchain con la dirección de la farmacia
        const result = await blockchainService.updatePrescriptionPharmacyAddress(prescriptionId, pharmacy.address);

        res.status(200).json({ message: '✅ Prescription sent to pharmacy successfully', result });
    } catch (err) {
        console.error('❌ Error sending prescription to pharmacy:', err.message);
        res.status(500).json({ message: 'Error sending prescription to pharmacy' });
    }
};
