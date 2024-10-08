const fs = require('fs');
const path = require('path');
const { Web3 } = require('web3');  // Cambiado aquí
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const Doctor = require('./models/Doctor');
const Patient = require('./models/Patient');

// Web3 config
const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:7545"));



// Leer las direcciones de los contratos desde el archivo JSON
const contractsDataPath = path.resolve(__dirname, '../prescryption_solidity/contracts_data.json');
const contractsData = JSON.parse(fs.readFileSync(contractsDataPath, 'utf8'));

// Cargar el ABI del contrato
const prescriptionContractPath = path.resolve(__dirname, '../prescryption_solidity/build/contracts', 'PrescriptionContract.json');
const prescriptionContractJSON = JSON.parse(fs.readFileSync(prescriptionContractPath, 'utf8'));

// Instanciar el contrato de recetas
const prescriptionContract = new web3.eth.Contract(prescriptionContractJSON.abi, contractsData.PrescriptionContract);

exports.issuePrescription = async (req, res) => {
    const {
        patientName,
        patientNid,
        affiliateNum,
        insuranceName,
        insurancePlan,
        med1,
        quantity1,
        med2,
        quantity2,
        diagnosis
    } = req.body;

    const { nid } = req.user; // NID del médico autenticado

    try {
        // Validaciones
        if (!patientName || !patientNid || !affiliateNum || !insuranceName || !insurancePlan || !med1 || !quantity1 || !diagnosis) {
            return res.status(400).send('Missing necessary data.');
        }

        // Buscar al doctor en la base de datos
        const doctor = await Doctor.findOne({ nid });
        if (!doctor) {
            return res.status(404).send('Doctor not found.');
        }

        // Buscar al paciente por NID en la base de datos
        const patient = await Patient.findOne({ nid: patientNid });
        if (!patient) {
            return res.status(404).send('Patient not found.');
        }

        const accounts = await web3.eth.getAccounts();
        const fromAccount = accounts[0];

        // Obtener la fecha actual (emisión) y calcular la fecha de vencimiento (30 días después)
        const issueDate = new Date();
        const expirationDate = new Date(issueDate);
        expirationDate.setDate(issueDate.getDate() + 30);

        // Preparar las structs para los datos de la receta y obra social
        const meds = {
            med1,
            quantity1,
            med2,
            quantity2,
            diagnosis
        };

        const insurance = {
            affiliateNum,
            insuranceName,
            insurancePlan
        };

        // Llamar al contrato para emitir la receta
        const receipt = await prescriptionContract.methods
            .issuePrescription(
                patientName,
                patientNid,
                meds,
                insurance,
                doctor.nid,
                patient.address
            )
            .send({ from: fromAccount, gas: '2000000' });

        if (receipt.status) {
            res.send({
                message: 'Prescription issued and saved in blockchain',
                transactionHash: receipt.transactionHash,
                blockNumber: receipt.blockNumber.toString(),
                gasUsed: receipt.gasUsed.toString()
            });
        } else {
            res.status(500).send('Error issuing prescription in blockchain');
        }
    } catch (error) {
        console.error('Error issuing prescription:', error);
        res.status(500).send('Error issuing prescription. Details: ' + error.message);
    }
};



exports.getPresbyDoctorNid = async (req, res) => {
    try {
        const { nid } = req.user; // NID del doctor desde el token JWT

        // Buscar el doctor en la base de datos (asumiendo que existe un modelo Doctor)
        const doctor = await Doctor.findOne({ nid });
        if (!doctor) {
            console.error(`Doctor with NID: ${nid} not found in the database.`);
            return res.status(404).send('Doctor not found.');
        }

        // Obtener cuentas de Ganache
        const accounts = await web3.eth.getAccounts();
        const fromAccount = accounts[0]; // Primera cuenta de Ganache

        // Llamar a la función del contrato inteligente para obtener recetas por NID del doctor
        const prescriptions = await prescriptionContract.methods.getPresbyDoctorNid(doctor.nid).call({ from: fromAccount });

        // Verificar si se encontraron recetas
        if (prescriptions.length === 0) {
            console.warn(`No prescriptions found for doctor NID: ${doctor.nid}`);
            return res.status(404).send('Prescriptions not found for this doctor.');
        }

        // Procesar las recetas, asegurándonos de manejar los BigInt
        const formattedPrescriptions = prescriptions.map(prescription => ({
            patientName: prescription.patientName,
            patientNid: prescription.patientNid,
            meds: {
                med1: prescription.meds.med1,
                quantity1: Number(prescription.meds.quantity1),
                med2: prescription.meds.med2,
                quantity2: Number(prescription.meds.quantity2),
                diagnosis: prescription.meds.diagnosis
            },
            insurance: {
                affiliateNum: prescription.insurance.affiliateNum,
                insuranceName: prescription.insurance.insuranceName,
                insurancePlan: prescription.insurance.insurancePlan
            },
            doctorNid: prescription.doctorNid,
            issueDate: Number(prescription.issueDate),
            expirationDate: Number(prescription.expirationDate),
            patientAddress: prescription.patientAddress
        }));


        // Enviar las recetas formateadas al frontend
        res.json({
            message: 'Prescriptions obtained successfully',
            prescriptions: formattedPrescriptions
        });
    } catch (error) {
        console.error('Error obtaining prescriptions:', error);
        res.status(500).send('Error obtaining prescriptions. Details: ' + error.message);
    }
};

// Función para convertir todos los BigInt a string en un objeto
const convertBigIntToString = (obj) => {
    if (typeof obj === 'bigint') {
        return obj.toString();
    }
    if (Array.isArray(obj)) {
        return obj.map(convertBigIntToString);
    }
    if (typeof obj === 'object' && obj !== null) {
        return Object.fromEntries(
            Object.entries(obj).map(([key, value]) => [key, convertBigIntToString(value)])
        );
    }
    return obj;
};

exports.getAllPrescriptions = async (req, res) => {
    try {
        // Obtener cuentas de Ganache (puedes usar la primera cuenta)
        const accounts = await web3.eth.getAccounts();
        const fromAccount = accounts[0]; // Usamos la primera cuenta de Ganache

        console.log(`Calling contract to get all prescriptions from account: ${fromAccount}`);

        // Llamar a la función del contrato inteligente para obtener todas las recetas
        const prescriptions = await prescriptionContract.methods.getPrescriptions().call({ from: fromAccount });

        // Verificar si se encontraron recetas
        if (prescriptions.length === 0) {
            console.warn('No prescriptions found in the blockchain.');
            return res.status(404).send('No prescriptions found.');
        }

        // Convertir todos los BigInt a strings en las recetas
        const formattedPrescriptions = convertBigIntToString(prescriptions);

        // Registrar las recetas obtenidas para depuración
        console.log('All prescriptions obtained:', formattedPrescriptions);

        // Enviar las recetas al frontend
        res.json({
            message: 'All prescriptions obtained successfully',
            prescriptions: formattedPrescriptions
        });
    } catch (error) {
        console.error('Error obtaining prescriptions:', error);
        res.status(500).send('Error obtaining prescriptions. Details: ' + error.message);
    }
};

exports.getPresbyPatientNid = async (req, res) => {
    try {
        const { nid } = req.user; // NID del paciente desde el token JWT

        // Buscar al paciente en la base de datos
        const patient = await Patient.findOne({ nid });
        if (!patient) {
            console.error(`Patient with NID: ${nid} not found in the database.`);
            return res.status(404).send('Patient not found.');
        }

        const patientAddress = patient.address;

        // Obtener cuentas de Ganache
        const accounts = await web3.eth.getAccounts();
        const fromAccount = accounts[0]; // Primera cuenta de Ganache

        // Llamar a la función del contrato inteligente para obtener recetas por dirección del paciente
        const prescriptions = await prescriptionContract.methods.getPresbyPatientAddress(patientAddress).call({ from: fromAccount });

        // Verificar si se encontraron recetas
        if (prescriptions.length === 0) {
            console.warn(`No prescriptions found for patient address: ${patientAddress}`);
            return res.status(404).send('Prescriptions not found for this patient.');
        }

        // Procesar las recetas, asegurándonos de manejar los BigInt
        const formattedPrescriptions = prescriptions.map(prescription => {
            const isExpired = new Date() > new Date(prescription.expirationDate);
            
            return {
                patientName: prescription.patientName,
                patientNid: prescription.patientNid,
                meds: {
                    med1: prescription.meds.med1,
                    quantity1: Number(prescription.meds.quantity1),
                    med2: prescription.meds.med2,
                    quantity2: Number(prescription.meds.quantity2),
                    diagnosis: prescription.meds.diagnosis
                },
                insurance: {
                    affiliateNum: prescription.insurance.affiliateNum,
                    insuranceName: prescription.insurance.insuranceName,
                    insurancePlan: prescription.insurance.insurancePlan
                },
                doctorNid: prescription.doctorNid,
                issueDate: Number(prescription.issueDate),
                expirationDate: Number(prescription.expirationDate),
                patientAddress: prescription.patientAddress,
                status: isExpired ? 'Expirada' : 'Vigente'
            };
        });
        

        // Enviar las recetas formateadas al frontend
        res.json({
            message: 'Prescriptions obtained successfully',
            prescriptions: formattedPrescriptions
        });
    } catch (error) {
        console.error('Error obtaining prescriptions:', error);
        res.status(500).send('Error obtaining prescriptions. Details: ' + error.message);
    }
};
