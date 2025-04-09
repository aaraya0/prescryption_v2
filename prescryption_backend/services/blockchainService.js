const { Web3 } = require('web3');
const fs = require('fs');
const path = require('path');
const { format } = require('date-fns');
const Doctor = require('../models/Doctor');


// ✅ Configuración de Web3
const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:7545"));

// ✅ Leer la dirección del contrato
const contractsDataPath = path.join(__dirname, '..', '..', 'prescryption_solidity', 'contracts_data.json');                                           //para Belu
//const contractsDataPath = 'D:\\prescryption_v3\\prescryption_solidity\\contracts_data.json';
let contractsData;

try {
    contractsData = JSON.parse(fs.readFileSync(contractsDataPath, 'utf8'));
    console.log('✔️ Dirección del contrato cargada:', contractsData.PrescriptionContract);
} catch (err) {
    console.error('❌ Error leyendo contracts_data.json:', err.message);
    throw new Error(`No se pudo leer contracts_data.json en ${contractsDataPath}`);
}

// ✅ Leer ABI del contrato
const prescriptionContractPath = path.join(__dirname, '..', '..', 'prescryption_solidity', 'build', 'contracts', 'PrescriptionContract.json');        //para Belu
//const prescriptionContractPath = 'D:\\prescryption_v3\\prescryption_solidity\\build\\contracts\\PrescriptionContract.json';
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

exports.updatePrescriptionPharmacyAddress = async (prescriptionId, pharmacyAddress) => {
    try {
        const accounts = await web3.eth.getAccounts();

        console.log('🔍 Updating prescription:', prescriptionId, 'with pharmacy address:', pharmacyAddress);

        const result = await prescriptionContract.methods
            .updatePrescription(prescriptionId, pharmacyAddress)
            .send({ from: accounts[0], gas: '2000000' });

        console.log('✅ Prescription updated successfully:', result);

        return {
            transactionHash: result.transactionHash,
            blockNumber: result.blockNumber,
            gasUsed: result.gasUsed
        };
    } catch (error) {
        console.error('❌ Error updating prescription pharmacy address:', error);

        // Extraer la razón de la reversión desde Ganache
        const revertReason = extractRevertReason(error);
        if (revertReason) {
            console.error('❌ Revert reason:', revertReason);
            throw new Error(revertReason); // Devolver solo el mensaje relevante
        }

        throw new Error('An unexpected error occurred while updating the prescription pharmacy address.');
    }
};

// 📌 Función para extraer la razón de la reversión
function extractRevertReason(error) {
    try {
        // Verificar si el error contiene `cause.message` con la razón de la reversión
        if (error.cause?.message && error.cause.message.includes("revert")) {
            return error.cause.message.split("revert ")[1]; // Extraer solo la razón
        }

        // Buscar en `error.message`
        if (error.message.includes("revert")) {
            return error.message.split("revert ")[1];
        }

        // Verificar en `error.data` (estructura alternativa de Ganache)
        if (error.data) {
            for (let key in error.data) {
                if (error.data[key]?.reason) {
                    return error.data[key].reason;
                }
            }
        }
    } catch (parseError) {
        console.error('❌ Failed to extract revert reason:', parseError.message);
    }

    return null; // Si no se encuentra ninguna razón específica
}

exports.getPrescriptionsByPharmacy = async (pharmacyAddress) => {
    try {
        const accounts = await web3.eth.getAccounts();

        console.log('🔍 Fetching prescriptions for pharmacy:', pharmacyAddress);

        const prescriptions = await prescriptionContract.methods
            .getPresbyPharmacyAddress(pharmacyAddress)
            .call({ from: accounts[0] });

        console.log('✅ Prescriptions retrieved:', prescriptions);

        return prescriptions.map(prescription => ({
            prescriptionId: prescription.id,
            patientName: prescription.patientName,
            patientNid: prescription.patientNid,
            meds: {
                med1: prescription.meds.med1,
                quantity1: Number(prescription.meds.quantity1),
                med2: prescription.meds.med2,
                quantity2: Number(prescription.meds.quantity2),
                diagnosis: prescription.meds.diagnosis,
                observations: prescription.meds.observations
            },
            insurance: {
                affiliateNum: prescription.insurance.affiliateNum,
                insuranceName: prescription.insurance.insuranceName,
                insurancePlan: prescription.insurance.insurancePlan
            },
            doctorNid: prescription.doctorNid,
            issueDate: new Date(Number(prescription.issueDate) * 1000).toLocaleDateString(),
            expirationDate: new Date(Number(prescription.expirationDate) * 1000).toLocaleDateString(),
            used: prescription.used,
            invoiceNumber: prescription.invoiceNumber || "",
            isPendingValidation: prescription.isPendingValidation
        }));
    } catch (error) {
        console.error('❌ Error fetching prescriptions for pharmacy:', error.message);
        throw new Error('Error fetching prescriptions for pharmacy');
    }
};

exports.getPrescriptionById = async (prescriptionId) => {
    try {
        const accounts = await web3.eth.getAccounts();
        
        console.log(`🔍 Fetching prescription with ID: ${prescriptionId}`);
        
        const prescription = await prescriptionContract.methods
            .getPrescription(prescriptionId)
            .call({ from: accounts[0] });

        if (!prescription) {
            throw new Error(`❌ Prescription with ID ${prescriptionId} not found.`);
        }

        console.log("✅ Prescription retrieved:", prescription);

        // Convertir BigInt a String para evitar errores con JSON
        const formattedPrescription = {
            id: prescription.id.toString(),
            patientName: prescription.patientName,
            patientNid: prescription.patientNid,
            meds: {
                med1: prescription.meds.med1,
                quantity1: prescription.meds.quantity1.toString(),
                med2: prescription.meds.med2,
                quantity2: prescription.meds.quantity2.toString(),
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
            invoiceNumber: prescription.invoiceNumber || ""
        };

        return formattedPrescription;
    } catch (error) {
        console.error("❌ Error fetching prescription:", error.message);
        throw new Error("Error fetching prescription from blockchain");
    }
};

exports.validatePrescriptionOnBlockchain = async (prescriptionId, pharmacyAddress) => {
    try {
        const accounts = await web3.eth.getAccounts();
        const validationTimestamp = Math.floor(Date.now() / 1000); // Timestamp actual

        console.log(`🔄 Validating prescription ID ${prescriptionId} on blockchain...`);

        const result = await prescriptionContract.methods
            .validatePrescription(prescriptionId, pharmacyAddress, validationTimestamp)
            .send({ from: accounts[0], gas: "2000000" });

        console.log("✅ Prescription validated successfully on blockchain:", result);
        return {
            transactionHash: result.transactionHash,
            blockNumber: result.blockNumber,
            gasUsed: result.gasUsed,
            validationTimestamp
        };
    } catch (error) {
        console.error("❌ Error validating prescription on blockchain:", error.message);
        throw new Error("Error validating prescription on blockchain.");
    }
};

exports.clearPendingValidation = async (prescriptionId) => {
    try {
        const accounts = await web3.eth.getAccounts();
        console.log(`🔄 Clearing prescription ID ${prescriptionId}...`);

        const result = await prescriptionContract.methods
            .clearPendingValidation(prescriptionId)
            .send({ from: accounts[0], gas: "2000000" });

        console.log("✅ Prescription cleared successfully:", result);
        return {
            transactionHash: result.transactionHash,
            blockNumber: result.blockNumber,
            gasUsed: result.gasUsed
        };
    } catch (error) {
        console.error("❌ Error clearing prescription:", error.message);
        throw new Error("Error clearing prescription.");
    }
};

exports.markPrescriptionAsUsed = async (prescriptionId, invoiceNumber, pharmacyAddress) => {
    try {
        console.log(`🔗 Enviando transacción a la blockchain para marcar la receta ${prescriptionId} como usada.`);
        
        const accounts = await web3.eth.getAccounts();
        const sender = accounts[0]; // Se usa la dirección de la farmacia o la cuenta 0

        await prescriptionContract.methods.markPrescriptionAsUsed(prescriptionId, invoiceNumber).send({
            from: sender,
            gas: 3000000
        });

        console.log(`✅ Receta ${prescriptionId} marcada como usada en la blockchain.`);
        return { success: true, message: `Prescription ${prescriptionId} marked as used.` };
    } catch (error) {
        console.error("❌ Error al marcar la receta como usada:", error);
        return { success: false, message: "Failed to mark prescription as used." };
    }
};