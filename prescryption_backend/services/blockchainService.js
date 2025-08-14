// backend/services/blockchainService.js
const { Web3 } = require("web3");
const fs = require("fs");
const path = require("path");
const { format } = require("date-fns");
const Doctor = require("../models/Doctor");
const { decrypt } = require("../utils/encryption");
const { web3, systemAccount } = require("../utils/systemSigner");
const { getPharmacySigner } = require("../utils/pharmacySigner");
const { fundIfLow } = require("../utils/fundAccount");

/**
 * 🔎 Resolución robusta de rutas para contratos
 * - Soporta empaquetar artefactos en /app/contracts (Cloud Run)
 * - Soporta volumen local en prescryption_solidity (docker-compose)
 * - Permite override via env: CONTRACTS_DIR
 */

const CONTRACTS_DIR =
  process.env.CONTRACTS_DIR ||
  path.join(__dirname, "..", "..", "prescryption_solidity");

const CONTRACTS_CANDIDATE_DIRS = [
  // 1) empaquetado en imagen (recomendado para Cloud Run)
  path.join(process.cwd(), "contracts"),
  // 2) por variable de entorno
  CONTRACTS_DIR,
];

function readJSONFromCandidates(relPath, labelForError) {
  const tried = [];
  for (const base of CONTRACTS_CANDIDATE_DIRS) {
    const full = path.join(base, relPath);
    tried.push(full);
    if (fs.existsSync(full)) {
      const txt = fs.readFileSync(full, "utf8");
      console.log(`✔️ Cargado ${labelForError}: ${full}`);
      return JSON.parse(txt);
    }
  }
  const msg = `No se encontró ${labelForError}. Rutas probadas: ${tried.join(
    " ; "
  )}`;
  console.error(`❌ ${msg}`);
  throw new Error(msg);
}

// 1) Dirección del contrato
const contractsData = readJSONFromCandidates(
  "contracts_data.json",
  "contracts_data.json"
);

// 2) ABI del contrato
const prescriptionContractJSON = readJSONFromCandidates(
  path.join("build", "contracts", "PrescriptionContract.json"),
  "PrescriptionContract.json (ABI)"
);

// Instancia del contrato
let prescriptionContract = new web3.eth.Contract(
  prescriptionContractJSON.abi,
  contractsData.PrescriptionContract
);

// ===================================================================
// Funciones de contrato
// ===================================================================

exports.getPrescriptionsByPatient = async (patientAddress) => {
  const rawPrescriptions = await prescriptionContract.methods
    .getPresbyPatientAddress(patientAddress)
    .call();

  const formattedPrescriptions = convertBigIntToString(rawPrescriptions);

  return formattedPrescriptions.map((prescription) => {
    const expiration = new Date(Number(prescription.expirationDate) * 1000);
    const now = new Date();

    let status = "Válida";
    if (prescription.used) {
      status = "Dispensada";
    } else if (expiration < now) {
      status = "Expirada";
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
        observations: prescription.meds.observations,
      },
      insurance: {
        affiliateNum: prescription.insurance.affiliateNum,
        insuranceName: prescription.insurance.insuranceName,
        insurancePlan: prescription.insurance.insurancePlan,
      },
      doctorNid: prescription.doctorNid,
      patientAddress: prescription.patientAddress,
      pharmacyAddress: prescription.pharmacyAddress,
      issueDate: new Date(Number(prescription.issueDate) * 1000).toISOString(),
      expirationDate: expiration.toISOString(),
      used: prescription.used,
      invoiceNumber: prescription.invoiceNumber,
      status, // calculated field
    };
  });
};

exports.getPrescriptionsByDoctor = async (nid) => {
  const rawPrescriptions = await prescriptionContract.methods
    .getPresbyDoctorNid(nid)
    .call();

  const formattedPrescriptions = convertBigIntToString(rawPrescriptions);

  return formattedPrescriptions.map((p) => ({
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
    invoiceNumber: p.invoiceNumber,
  }));
};

function convertBigIntToString(obj) {
  if (typeof obj === "bigint") {
    return obj.toString();
  } else if (Array.isArray(obj)) {
    return obj.map(convertBigIntToString);
  } else if (typeof obj === "object" && obj !== null) {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [
        key,
        convertBigIntToString(value),
      ])
    );
  }
  return obj;
}

exports.issuePrescription = async (prescriptionData, doctorNid) => {
  try {
    const doctor = await Doctor.findOne({ nid: doctorNid });
    if (!doctor) {
      throw new Error("Doctor not found");
    }

    const decryptedKey = decrypt(doctor.privateKey);
    const doctorAccount = web3.eth.accounts.privateKeyToAccount(decryptedKey);
    web3.eth.accounts.wallet.add(doctorAccount);

    console.log(
      `🔄 [issuePrescription] Chequeando gas para doctor ${doctorAccount.address}`
    );
    await fundIfLow(doctorAccount.address);
    console.log(
      `✅ [issuePrescription] Gas chequeado para ${doctorAccount.address}`
    );

    const patientStruct = {
      name: prescriptionData.patientName,
      surname: prescriptionData.patientSurname,
      nid: prescriptionData.patientNid,
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
        gas: "2000000",
      });

    web3.eth.accounts.wallet.remove(doctorAccount.address);

    return convertBigIntToString({
      message: "Prescription issued and saved in blockchain",
      prescriptionId: receipt.events.IssuedPrescription.returnValues.id,
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed,
    });
  } catch (error) {
    console.error("Error issuing prescription:", error);
    throw error;
  }
};

BigInt.prototype.toJSON = function () {
  return this.toString();
};

exports.getAllPrescriptions = async () => {
  const rawPrescriptions = await prescriptionContract.methods
    .getPrescriptions()
    .call();

  const formattedPrescriptions = rawPrescriptions.map((prescription) => ({
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
      observations: prescription.meds.observations,
    },
    insurance: {
      affiliateNum: prescription.insurance.affiliateNum,
      insuranceName: prescription.insurance.insuranceName,
      insurancePlan: prescription.insurance.insurancePlan,
    },
    doctorNid: prescription.doctorNid,
    patientAddress: prescription.patientAddress,
    pharmacyAddress: prescription.pharmacyAddress,
    issueDate: format(
      new Date(Number(prescription.issueDate) * 1000),
      "yyyy-MM-dd HH:mm:ss"
    ),
    expirationDate: format(
      new Date(Number(prescription.expirationDate) * 1000),
      "yyyy-MM-dd HH:mm:ss"
    ),
    used: prescription.used,
    invoiceNumber: prescription.invoiceNumber,
  }));

  return formattedPrescriptions;
};

exports.updatePrescriptionPharmacyAddress = async (
  prescriptionId,
  pharmacyAddress
) => {
  try {
    const tx = prescriptionContract.methods.updatePrescription(
      prescriptionId,
      pharmacyAddress
    );

    const gas = await tx.estimateGas({ from: systemAccount.address });
    const gasPrice = await web3.eth.getGasPrice();

    const signedTx = await web3.eth.accounts.signTransaction(
      {
        from: systemAccount.address,
        to: prescriptionContract.options.address,
        data: tx.encodeABI(),
        gas,
        gasPrice,
      },
      systemAccount.privateKey
    );

    const receipt = await web3.eth.sendSignedTransaction(
      signedTx.rawTransaction
    );

    console.log("✅ Prescription updated successfully:", receipt);

    return {
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed,
    };
  } catch (error) {
    console.error("❌ Error updating prescription pharmacy address:", error);

    const revertReason = extractRevertReason(error);
    if (revertReason) {
      console.error("❌ Revert reason:", revertReason);
      throw new Error(revertReason);
    }

    throw new Error(
      "An unexpected error occurred while updating the prescription pharmacy address."
    );
  }
};

// extract revert (error) reason in bc for ganache
function extractRevertReason(error) {
  try {
    if (error.cause?.message && error.cause.message.includes("revert")) {
      return error.cause.message.split("revert ")[1];
    }

    if (error.message.includes("revert")) {
      return error.message.split("revert ")[1];
    }

    if (error.data) {
      for (let key in error.data) {
        if (error.data[key]?.reason) {
          return error.data[key].reason;
        }
      }
    }
  } catch (parseError) {
    console.error("❌ Failed to extract revert reason:", parseError.message);
  }

  return null;
}

exports.getPrescriptionsByPharmacy = async (pharmacyAddress) => {
  try {
    console.log("🔍 Fetching prescriptions for pharmacy:", pharmacyAddress);

    const prescriptions = await prescriptionContract.methods
      .getPresbyPharmacyAddress(pharmacyAddress)
      .call();

    console.log("✅ Prescriptions retrieved:", prescriptions);

    return prescriptions.map((prescription) => ({
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
        observations: prescription.meds.observations,
      },
      insurance: {
        affiliateNum: prescription.insurance.affiliateNum,
        insuranceName: prescription.insurance.insuranceName,
        insurancePlan: prescription.insurance.insurancePlan,
      },
      doctorNid: prescription.doctorNid,
      issueDate: new Date(Number(prescription.issueDate) * 1000).toISOString(),
      expirationDate: new Date(
        Number(prescription.expirationDate) * 1000
      ).toISOString(),
      used: prescription.used,
      invoiceNumber: prescription.invoiceNumber || "",
      isPendingValidation: prescription.isPendingValidation,
    }));
  } catch (error) {
    console.error(
      "❌ Error fetching prescriptions for pharmacy:",
      error.message
    );
    throw new Error("Error fetching prescriptions for pharmacy");
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
        observations: prescription.meds.observations,
      },
      insurance: {
        affiliateNum: prescription.insurance.affiliateNum,
        insuranceName: prescription.insurance.insuranceName,
        insurancePlan: prescription.insurance.insurancePlan,
      },
      doctorNid: prescription.doctorNid,
      patientAddress: prescription.patientAddress,
      pharmacyAddress: prescription.pharmacyAddress,
      issueDate: new Date(Number(prescription.issueDate) * 1000).toISOString(),
      expirationDate: new Date(
        Number(prescription.expirationDate) * 1000
      ).toISOString(),
      used: prescription.used,
      invoiceNumber: prescription.invoiceNumber || "",
    };

    return formattedPrescription;
  } catch (error) {
    console.error("❌ Error fetching prescription:", error.message);
    throw new Error("Error fetching prescription from blockchain");
  }
};

exports.validatePrescriptionOnBlockchain = async (
  prescriptionId,
  pharmacyNid,
  pharmacyAddress
) => {
  try {
    const pharmacyAccount = await getPharmacySigner(pharmacyNid);
    await fundIfLow(pharmacyAccount.address);
    const validationTimestamp = Math.floor(Date.now() / 1000);

    const result = await prescriptionContract.methods
      .validatePrescription(
        prescriptionId,
        pharmacyAddress,
        validationTimestamp
      )
      .send({ from: pharmacyAccount.address, gas: 2000000 });

    web3.eth.accounts.wallet.remove(pharmacyAccount.address);

    return {
      transactionHash: result.transactionHash,
      blockNumber: result.blockNumber,
      gasUsed: result.gasUsed,
      validationTimestamp,
    };
  } catch (error) {
    console.error("❌ Error validating prescription on blockchain:", error);
    throw new Error("Error validating prescription on blockchain.");
  }
};

exports.clearPendingValidation = async (prescriptionId, pharmacyNid) => {
  try {
    const pharmacyAccount = await getPharmacySigner(pharmacyNid);
    await fundIfLow(pharmacyAccount.address);

    const result = await prescriptionContract.methods
      .clearPendingValidation(prescriptionId)
      .send({ from: pharmacyAccount.address, gas: 2000000 });

    web3.eth.accounts.wallet.remove(pharmacyAccount.address);

    return {
      transactionHash: result.transactionHash,
      blockNumber: result.blockNumber,
      gasUsed: result.gasUsed,
    };
  } catch (error) {
    console.error("❌ Error clearing prescription:", error.message);
    throw new Error("Error clearing prescription.");
  }
};

exports.markPrescriptionAsUsed = async (
  prescriptionId,
  originalInvoiceNumber,
  pharmacyNid,
  pharmacistNid
) => {
  try {
    const pharmacyAccount = await getPharmacySigner(pharmacyNid);
    await fundIfLow(pharmacyAccount.address);
    const invoiceNumber = `${originalInvoiceNumber}|${pharmacistNid}`;

    await prescriptionContract.methods
      .markPrescriptionAsUsed(prescriptionId, invoiceNumber)
      .send({ from: pharmacyAccount.address, gas: 3000000 });

    web3.eth.accounts.wallet.remove(pharmacyAccount.address);

    return {
      success: true,
      message: `Prescription ${prescriptionId} marked as used.`,
    };
  } catch (error) {
    console.error("❌ Error al marcar la receta como usada:", error);
    return {
      success: false,
      message: "Failed to mark prescription as used.",
    };
  }
};
