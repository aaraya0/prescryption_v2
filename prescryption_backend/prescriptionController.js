const fs = require('fs');
const path = require('path');
const { Web3 } = require('web3');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const Doctor = require('./models/Doctor');
const Patient = require('./models/Patient'); // Importa el modelo de Paciente

// Web3 config
const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:7545"));

// Compiled contract and address ABI
const contractPath = path.resolve(__dirname, '../prescryption_solidity/build/contracts', 'PrescriptionContract.json');
const contractJSON = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
const contractAddress = "0x53591ac659e8CfD73046923C01778f1E71D68678"; // Ganache contract address
const prescriptionContract = new web3.eth.Contract(contractJSON.abi, contractAddress);

// Función auxiliar para desencriptar la clave privada del médico
const decryptPrivateKey = (encryptedPrivateKey, password) => {
    const decipher = crypto.createDecipher('aes-256-cbc', password);
    let decrypted = decipher.update(encryptedPrivateKey, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};

// Emitir receta firmada por el médico
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

        // Buscar al paciente por NID en la base de datos
        const patient = await Patient.findOne({ nid: patientNid });
        if (!patient) {
            return res.status(404).send('Patient not found.');
        }
        
        // Obtener la dirección del paciente de la base de datos
        const patientAddress = patient.blockchain.address;

        // Buscar al doctor en la base de datos
        const doctor = await Doctor.findOne({ nid });
        if (!doctor) {
            return res.status(404).send('Doctor not found.');
        }

        // Desencriptar la clave privada del médico para firmar la transacción
        const privateKey = decryptPrivateKey(doctor.blockchain.privateKey, doctor.password);

        // Firmar la transacción con la clave privada del médico
        const account = web3.eth.accounts.privateKeyToAccount(privateKey);
        web3.eth.accounts.wallet.add(account);
        const fromAccount = account.address;

        console.log('Sending signed transaction...');

        // Enviar la transacción firmada al contrato
        const receipt = await prescriptionContract.methods
            .issuePrescription(
                patientName,
                patientNid,
                affiliateNum,
                insuranceName,
                insurancePlan,
                med1,
                quantity1,
                med2,
                quantity2,
                diagnosis,
                doctor.nid,
                patientAddress // Aquí va la dirección del paciente obtenida de la base de datos
            )
            .send({ from: fromAccount, gas: '2000000' });
        
        const prescriptionId = receipt.events.IssuedPrescription.returnValues.prescriptionId; // Captura el prescriptionId

        console.log('Transaction Receipt:', receipt);

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

        // Registrar para depuración
        console.log(`Doctor found: ${doctor.nid}, calling contract from account: ${fromAccount}`);

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
            affiliateNum: prescription.affiliateNum,
            insuranceName: prescription.insuranceName,
            insurancePlan: prescription.insurancePlan,
            med1: prescription.med1,
            quantity1: Number(prescription.quantity1), // Convertir BigInt a Number
            med2: prescription.med2,
            quantity2: Number(prescription.quantity2), // Convertir BigInt a Number
            diagnosis: prescription.diagnosis,
            doctorNid: prescription.doctorNid
        }));

        // Registrar las recetas formateadas para depuración
        console.log('Formatted prescriptions:', formattedPrescriptions);

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
