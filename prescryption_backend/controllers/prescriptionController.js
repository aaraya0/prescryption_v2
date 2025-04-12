const blockchainService = require('../services/blockchainService');

const Patient = require('../models/Patient');

exports.issuePrescription = async (req, res) => {
    const {
        patientName,
        patientSurname,
        patientNid,
        affiliateNum,
        insuranceName,
        insurancePlan,
        med1,
        quantity1,
        med2,
        quantity2,
        diagnosis,
        observations
    } = req.body;

    const { nid } = req.user; // NID del doctor autenticado

    try {
        // Validaciones
        if (!patientName || !patientSurname || !patientNid || !affiliateNum || !insuranceName || !insurancePlan || !med1 || !quantity1 || !diagnosis) {
            return res.status(400).send('Missing necessary data.');
        }

        // Buscar el paciente en la base de datos
        const patient = await Patient.findOne({ nid: patientNid });
        if (!patient) {
            return res.status(404).send('Patient not found.');
        }

        // Preparar los datos de la receta
        const prescriptionData = {
            patientName,
            patientSurname,
            patientNid,
            meds: {
                med1,
                quantity1,
                med2: med2 || "N/A",
                quantity2: quantity2 || 0,
                diagnosis,
                observations: observations || " "
            },
            insurance: {
                affiliateNum,
                insuranceName,
                insurancePlan
            },
            patientAddress: patient.address // Dirección obtenida automáticamente
        };

        // Enviar la receta al servicio
        const receipt = await blockchainService.issuePrescription(prescriptionData, nid);
        res.json(receipt);

    } catch (err) {
        console.error('Error issuing prescription:', err);
        res.status(500).send('Error issuing prescription. Details: ' + err.message);
    }
};


exports.getAllPrescriptions = async (req, res) => {
    try {
        const prescriptions = await blockchainService.getAllPrescriptions();
        res.json(prescriptions);
    } catch (err) {
        console.error('Error retrieving prescriptions:', err);
        res.status(500).send('Error retrieving prescriptions. Details: ' + err.message);
    }
};
