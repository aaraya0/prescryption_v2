const { Web3 } = require('web3');
const fs = require('fs');
const path = require('path');
const { format } = require('date-fns');
const Doctor = require('../models/Doctor');


// ✅ Configuración de Web3
const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:7545"));

// ✅ Leer la dirección del contrato
const contractsDataPath = 'D:\\prescryption_v3\\prescryption_solidity\\contracts_data.json';
let contractsData;

try {
    contractsData = JSON.parse(fs.readFileSync(contractsDataPath, 'utf8'));
    console.log('✔️ Dirección del contrato cargada:', contractsData.PrescriptionContract);
} catch (err) {
    console.error('❌ Error leyendo contracts_data.json:', err.message);
    throw new Error(`No se pudo leer contracts_data.json en ${contractsDataPath}`);
}

// ✅ Leer ABI del contrato
const prescriptionContractPath = 'D:\\prescryption_v3\\prescryption_solidity\\PrescriptionContract.json';
let prescriptionContractJSON;

try {
    prescriptionContractJSON = JSON.parse(fs.readFileSync(prescriptionContractPath, 'utf8'));
    console.log('✔️ ABI del contrato cargado correctamente');
} catch (err) {
    console.error('❌ Error leyendo PrescriptionContract.json:', err.message);
    throw new Error(`No se pudo leer PrescriptionContract.json en ${prescriptionContractPath}`);
}

// ✅ Instanciar el contrato
const prescriptionContract = new web3.eth.Contract(prescriptionContractJSON.abi, contractsData.PrescriptionContract);

// ✅ Funciones del contrato
exports.getPrescriptionsByPatient = async (patientAddress) => {
    const accounts = await web3.eth.getAccounts();
    const rawPrescriptions = await prescriptionContract.methods.getPresbyPatientAddress(patientAddress).call({ from: accounts[0] });

    // Formatear los datos
    const formattedPrescriptions = convertBigIntToString(rawPrescriptions);

    return formattedPrescriptions.map(prescription => ({
        id: prescription.id,
        patientName: prescription.patientName,
        patientNid: prescription.patientNid,
        meds: {
            med1: prescription.meds.med1,
            quantity1: prescription.meds.quantity1,
            med2: prescription.meds.med2,
            quantity2: prescription.meds.quantity2,
            diagnosis: prescription.meds.diagnosis,
            observations: prescription.meds.observations
        },
        insurance: {
            affiliateNum: prescription.insurance.affiliateNum,
            insuranceName: prescription.insurance.insuranceName,
            insurancePlan: prescription.insurance.insurancePlan
        },
        doctorNid: prescription.doctorNid,
        patientAddress: prescription.patientAddress,
        pharmacyAddress: prescription.pharmacyAddress,
        issueDate: new Date(Number(prescription.issueDate) * 1000).toISOString(),
        expirationDate: new Date(Number(prescription.expirationDate) * 1000).toISOString(),
        used: prescription.used,
        invoiceNumber: prescription.invoiceNumber
    }));
};


exports.getPrescriptionsByDoctor = async (nid) => {
    const accounts = await web3.eth.getAccounts();
    const rawPrescriptions = await prescriptionContract.methods.getPresbyDoctorNid(nid).call({ from: accounts[0] });

    // Convertir y formatear los datos
    const formattedPrescriptions = convertBigIntToString(rawPrescriptions);

    return formattedPrescriptions.map(prescription => ({
        id: prescription.id,
        patientName: prescription.patientName,
        patientNid: prescription.patientNid,
        meds: {
            med1: prescription.meds.med1,
            quantity1: prescription.meds.quantity1,
            med2: prescription.meds.med2,
            quantity2: prescription.meds.quantity2,
            diagnosis: prescription.meds.diagnosis,
            observations: prescription.meds.observations
        },
        insurance: {
            affiliateNum: prescription.insurance.affiliateNum,
            insuranceName: prescription.insurance.insuranceName,
            insurancePlan: prescription.insurance.insurancePlan
        },
        doctorNid: prescription.doctorNid,
        patientAddress: prescription.patientAddress,
        pharmacyAddress: prescription.pharmacyAddress,
        issueDate: new Date(Number(prescription.issueDate) * 1000).toISOString(),
        expirationDate: new Date(Number(prescription.expirationDate) * 1000).toISOString(),
        used: prescription.used,
        invoiceNumber: prescription.invoiceNumber
    }));
};





function convertBigIntToString(obj) {
    if (typeof obj === 'bigint') {
        return obj.toString(); // Convertir BigInt a String
    } else if (Array.isArray(obj)) {
        return obj.map(convertBigIntToString);
    } else if (typeof obj === 'object' && obj !== null) {
        return Object.fromEntries(
            Object.entries(obj).map(([key, value]) => [key, convertBigIntToString(value)])
        );
    }
    return obj;
}

exports.issuePrescription = async (prescriptionData, doctorNid) => {
    try {
        // Buscar la clave privada del doctor
        const doctor = await Doctor.findOne({ nid: doctorNid });
        if (!doctor) {
            throw new Error('Doctor not found');
        }

        const doctorPrivateKey = doctor.privateKey;

        // Crear cuenta temporal con la clave privada
        const doctorAccount = web3.eth.accounts.privateKeyToAccount(doctorPrivateKey);
        web3.eth.accounts.wallet.add(doctorAccount);

        // Usar una cuenta administrativa para pagar el gas
        const accounts = await web3.eth.getAccounts();
        const adminAccount = accounts[0]; // Cuenta administrativa

        const receipt = await prescriptionContract.methods
            .issuePrescription(
                prescriptionData.patientName,
                prescriptionData.patientNid,
                prescriptionData.meds,
                prescriptionData.insurance,
                doctorNid,
                prescriptionData.patientAddress,
                Math.floor(Date.now() / 1000)
            )
            .send({
                from: adminAccount, // Usar la cuenta administrativa para pagar el gas
                gas: '2000000',
                signTransaction: doctorAccount.signTransaction
            });

        // Eliminar cuenta temporal
        web3.eth.accounts.wallet.remove(doctorAccount.address);

        // Convertir BigInt a String
        const formattedReceipt = convertBigIntToString({
            message: 'Prescription issued and saved in blockchain',
            prescriptionId: receipt.events.IssuedPrescription.returnValues.id,
            transactionHash: receipt.transactionHash,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed
        });

        return formattedReceipt;

    } catch (error) {
        console.error('Error issuing prescription:', error);
        throw error;
    }
};


BigInt.prototype.toJSON = function () {
    return this.toString(); // Convertir BigInt a String automáticamente
};

exports.getAllPrescriptions = async () => {
    const accounts = await web3.eth.getAccounts();
    const rawPrescriptions = await prescriptionContract.methods.getPrescriptions().call({ from: accounts[0] });

    // Limpiar y formatear los datos
    const formattedPrescriptions = rawPrescriptions.map(prescription => ({
        id: prescription.id,
        patientName: prescription.patientName,
        patientNid: prescription.patientNid,
        meds: {
            med1: prescription.meds.med1,
            quantity1: prescription.meds.quantity1,
            med2: prescription.meds.med2,
            quantity2: prescription.meds.quantity2,
            diagnosis: prescription.meds.diagnosis,
            observations: prescription.meds.observations
        },
        insurance: {
            affiliateNum: prescription.insurance.affiliateNum,
            insuranceName: prescription.insurance.insuranceName,
            insurancePlan: prescription.insurance.insurancePlan
        },
        doctorNid: prescription.doctorNid,
        patientAddress: prescription.patientAddress,
        pharmacyAddress: prescription.pharmacyAddress,
        issueDate: format(new Date(Number(prescription.issueDate) * 1000), 'yyyy-MM-dd HH:mm:ss'), // Convertir a Number
        expirationDate: format(new Date(Number(prescription.expirationDate) * 1000), 'yyyy-MM-dd HH:mm:ss'), // Convertir a Number
        used: prescription.used,
        invoiceNumber: prescription.invoiceNumber
    }));

    return formattedPrescriptions;
};

