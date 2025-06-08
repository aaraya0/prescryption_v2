const { Web3 } = require('web3');
const fs = require('fs');
const path = require('path');
const { format } = require('date-fns');
const Doctor = require('../models/Doctor');
const { decrypt } = require('../utils/encryption');
const { web3, systemAccount } = require('../utils/systemSigner');
const { getPharmacySigner } = require('../utils/pharmacySigner');


// ✅ Configuración de Web3
//const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:7545"));
//const web3 = new Web3(`https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`);
//const web3 = new Web3(process.env.SEPOLIA_RPC_URL);



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

    const rawPrescriptions = await prescriptionContract.methods.getPresbyPatientAddress(patientAddress).call();

    // Formatear los datos
    const formattedPrescriptions = convertBigIntToString(rawPrescriptions);

    return formattedPrescriptions.map(prescription => {
        const expiration = new Date(Number(prescription.expirationDate) * 1000);
        const now = new Date();
    
        let status = 'Válida';
        if (prescription.used) {
            status = 'Dispensada';
        } else if (expiration < now) {
            status = 'Expirada';
        }
    
        return {
            id: prescription.id,
            patientName: prescription.patient.name,
            patientSurname: prescription.patient.surname,
            patientNid: prescription.patient.nid,
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
            expirationDate: expiration.toISOString(),
            used: prescription.used,
            invoiceNumber: prescription.invoiceNumber,
            status // ✅ nuevo campo calculado
        };
    });
    
};


exports.getPrescriptionsByDoctor = async (nid) => {
    const rawPrescriptions = await prescriptionContract.methods.getPresbyDoctorNid(nid).call();

    const formattedPrescriptions = convertBigIntToString(rawPrescriptions);

    return formattedPrescriptions.map(p => ({
        id: p.id,
        patientName: p.patient.name,
        patientSurname: p.patient.surname,
        patientNid: p.patient.nid,
        meds: p.meds,
        insurance: p.insurance,
        doctorNid: p.doctorNid,
        patientAddress: p.patientAddress,
        pharmacyAddress: p.pharmacyAddress,
        issueDate: new Date(Number(p.issueDate) * 1000).toISOString(),
        expirationDate: new Date(Number(p.expirationDate) * 1000).toISOString(),
        used: p.used,
        invoiceNumber: p.invoiceNumber
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
        const doctor = await Doctor.findOne({ nid: doctorNid });
        if (!doctor) {
            throw new Error('Doctor not found');
        }


        const decryptedKey = decrypt(doctor.privateKey);
        const doctorAccount = web3.eth.accounts.privateKeyToAccount(decryptedKey);
        web3.eth.accounts.wallet.add(doctorAccount);


        const patientStruct = {
            name: prescriptionData.patientName,
            surname: prescriptionData.patientSurname,
            nid: prescriptionData.patientNid
        };

        const receipt = await prescriptionContract.methods
            .issuePrescription(
                patientStruct,
                prescriptionData.meds,
                prescriptionData.insurance,
                doctorNid,
                prescriptionData.patientAddress,
                Math.floor(Date.now() / 1000)
            )
            .send({
                from: doctorAccount.address,
                gas: '2000000'
            });

        web3.eth.accounts.wallet.remove(doctorAccount.address);


        return convertBigIntToString({
            message: 'Prescription issued and saved in blockchain',
            prescriptionId: receipt.events.IssuedPrescription.returnValues.id,
            transactionHash: receipt.transactionHash,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed
        });

    } catch (error) {
        console.error('Error issuing prescription:', error);
        throw error;
    }
};



BigInt.prototype.toJSON = function () {
    return this.toString(); // Convertir BigInt a String automáticamente
};

exports.getAllPrescriptions = async () => {
    const rawPrescriptions = await prescriptionContract.methods.getPrescriptions().call();

    // Limpiar y formatear los datos
    const formattedPrescriptions = rawPrescriptions.map(prescription => ({
        id: prescription.id,
        patientName: prescription.patient.name,
        patientSurname: prescription.patient.surname,
        patientNid: prescription.patient.nid,
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
        const tx = prescriptionContract.methods.updatePrescription(prescriptionId, pharmacyAddress);

        const gas = await tx.estimateGas({ from: systemAccount.address });
        const gasPrice = await web3.eth.getGasPrice();

        const signedTx = await web3.eth.accounts.signTransaction(
            {
                from: systemAccount.address, // ✅ Agregado
                to: prescriptionContract.options.address,
                data: tx.encodeABI(),
                gas,
                gasPrice,
            },
            systemAccount.privateKey
        );

        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

        console.log('✅ Prescription updated successfully:', receipt);

        return {
            transactionHash: receipt.transactionHash,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed
        };
    } catch (error) {
        console.error('❌ Error updating prescription pharmacy address:', error);

        // Si querés mantener el extractor de errores:
        const revertReason = extractRevertReason(error);
        if (revertReason) {
            console.error('❌ Revert reason:', revertReason);
            throw new Error(revertReason);
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

        console.log('🔍 Fetching prescriptions for pharmacy:', pharmacyAddress);

        const prescriptions = await prescriptionContract.methods
            .getPresbyPharmacyAddress(pharmacyAddress)
            .call();

        console.log('✅ Prescriptions retrieved:', prescriptions);

        return prescriptions.map(prescription => ({
            prescriptionId: prescription.id,
            patientName: prescription.patient.name,
            patientSurname: prescription.patient.surname,
            patientNid: prescription.patient.nid,
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
        
        console.log(`🔍 Fetching prescription with ID: ${prescriptionId}`);
        
        const prescription = await prescriptionContract.methods
            .getPrescription(prescriptionId)
            .call();

        if (!prescription) {
            throw new Error(`❌ Prescription with ID ${prescriptionId} not found.`);
        }

        console.log("✅ Prescription retrieved:", prescription);

        // Convertir BigInt a String para evitar errores con JSON
        const formattedPrescription = {
            id: prescription.id.toString(),
            patientName: prescription.patient.name,
            patientSurname: prescription.patient.surname,
            patientNid: prescription.patient.nid,
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


exports.validatePrescriptionOnBlockchain = async (prescriptionId, pharmacyNid, pharmacyAddress) => {
    try {
        const pharmacyAccount = await getPharmacySigner(pharmacyNid);
        const validationTimestamp = Math.floor(Date.now() / 1000);

        const result = await prescriptionContract.methods
            .validatePrescription(prescriptionId, pharmacyAddress, validationTimestamp)
            .send({ from: pharmacyAccount.address, gas: 2000000 });

        web3.eth.accounts.wallet.remove(pharmacyAccount.address);

        return {
            transactionHash: result.transactionHash,
            blockNumber: result.blockNumber,
            gasUsed: result.gasUsed,
            validationTimestamp
        };
    } catch (error) {
        console.error("❌ Error validating prescription on blockchain:", error);
        throw new Error("Error validating prescription on blockchain.");
    }
};

exports.clearPendingValidation = async (prescriptionId, pharmacyNid) => {
    try {
        const pharmacyAccount = await getPharmacySigner(pharmacyNid);

        const result = await prescriptionContract.methods
            .clearPendingValidation(prescriptionId)
            .send({ from: pharmacyAccount.address, gas: 2000000 });

        web3.eth.accounts.wallet.remove(pharmacyAccount.address);

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

exports.markPrescriptionAsUsed = async (prescriptionId, originalInvoiceNumber, pharmacyNid, pharmacistNid) => {
    try {
        const pharmacyAccount = await getPharmacySigner(pharmacyNid);
        const invoiceNumber = `${originalInvoiceNumber}|${pharmacistNid}`;

        await prescriptionContract.methods
            .markPrescriptionAsUsed(prescriptionId, invoiceNumber)
            .send({ from: pharmacyAccount.address, gas: 3000000 });

        web3.eth.accounts.wallet.remove(pharmacyAccount.address);

        return {
            success: true,
            message: `Prescription ${prescriptionId} marked as used.`
        };
    } catch (error) {
        console.error("❌ Error al marcar la receta como usada:", error);
        return {
            success: false,
            message: "Failed to mark prescription as used."
        };
    }
};
