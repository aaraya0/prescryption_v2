const bcrypt = require("bcrypt");
const { encrypt } = require("../utils/encryption");
const axios = require("axios");
const PharmacyUser = require("../models/PharmacyUser");
const Pharmacy = require("../models/Pharmacy");
const Doctor = require("../models/Doctor");
const { Web3 } = require("web3");
const blockchainService = require("../services/blockchainService");
const medicationScraper = require("../services/medicationScraper"); 
const MedicationCache = require("../models/MedicationCache"); 
const fundAccount = require("../utils/fundAccount");
const PrescriptionValidation = require("../models/PrescriptionValidation");
const { verifyLicense, verifyLicenseToken, verifyPrescription, invoiceService } = require("../utils/serviceUrls");

const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:7545"));
const crypto = require("crypto");

exports.deactivatePharmacyUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const loggedInPharmacy = await Pharmacy.findOne({ nid: req.user.nid });
    if (!loggedInPharmacy) {
      return res.status(401).json({ message: "❌ Pharmacy not authorized" });
    }

    const user = await PharmacyUser.findById(userId);
    if (!user || user.pharmacyNid !== loggedInPharmacy.nid) {
      return res
        .status(404)
        .json({ message: "❌ User not found or not authorized" });
    }

    user.isActive = false;
    await user.save();
    res.status(200).json({ message: "✅ User deactivated successfully." });
  } catch (err) {
    console.error("❌ Error deactivating user:", err.message);
    res.status(500).json({ message: "Error deactivating user" });
  }
};

exports.activatePharmacyUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const loggedInPharmacy = await Pharmacy.findOne({ nid: req.user.nid });
    if (!loggedInPharmacy) {
      return res.status(401).json({ message: "❌ Pharmacy not authorized" });
    }

    const user = await PharmacyUser.findById(userId);
    if (!user || user.pharmacyNid !== loggedInPharmacy.nid) {
      return res
        .status(404)
        .json({ message: "❌ User not found or not authorized" });
    }

    user.isActive = true;
    await user.save();
    res.status(200).json({ message: "✅ User activated successfully." });
  } catch (err) {
    console.error("❌ Error activating user:", err.message);
    res.status(500).json({ message: "Error activating user" });
  }
};

exports.registerPharmacy = async (req, res) => {
  const { nid, pharmacy_name, mail, password, physicalAddress, contactInfo } =
    req.body;

  try {

    if (!nid || !pharmacy_name || !mail || !password || !physicalAddress) {
      return res.status(400).send("❌ Missing required fields");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const account = web3.eth.accounts.create();
    const encryptedPrivateKey = encrypt(account.privateKey);

    // creates random unique code for each pharmacy (extra validation)
    const verificationCode = crypto.randomBytes(6).toString("hex");
    await fundAccount(account.address);

    const newPharmacy = new Pharmacy({
      nid,
      pharmacy_name,
      mail,
      password: hashedPassword,
      address: account.address, 
      privateKey: encryptedPrivateKey,
      physicalAddress,
      contactInfo,
      verificationCode,
    });

    await newPharmacy.save();

    res.status(201).json({
      message: "✅ Pharmacy registered successfully.",
      verificationCode,
    });
  } catch (err) {
    console.error("❌ Error registering pharmacy:", err.message);
    res.status(500).send("Error registering pharmacy");
  }
};

exports.registerPharmacyUser = async (req, res) => {
  const {
    pharmacyNid,
    name,
    surname,
    nid,
    license,
    email,
    password,
    verificationCode,
  } = req.body;

  try {

    if (
      !pharmacyNid ||
      !name ||
      !surname ||
      !nid ||
      !license ||
      !email ||
      !password ||
      !verificationCode
    ) {
      return res.status(400).json({ message: "❌ Missing required fields" });
    }

    const pharmacy = await Pharmacy.findOne({ nid: pharmacyNid });
    if (!pharmacy) {
      return res.status(404).json({ message: "Pharmacy not found" });
    }

    if (pharmacy.verificationCode !== verificationCode) {
      return res.status(400).json({ message: "❌ Invalid verification code" });
    }

    const verifyResponse = await axios.post(
      verifyLicense.url("/verify"),
      {
        nid,
        license,
        user_type: "pharmacist", 
      },
      {
        headers: { Authorization:`Bearer ${verifyLicenseToken}` }, 
      }
    );

    if (!verifyResponse.data.valid) {
      return res.status(400).json({ message: "❌ Invalid license or NID" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new PharmacyUser({
      pharmacyNid,
      name,
      surname,
      nid,
      license,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    res
      .status(201)
      .json({ message: "✅ Pharmacy user registered successfully." });
  } catch (err) {
    console.error("❌ Error registering pharmacy user:", err.message);

    if (err.response && err.response.status === 404) {
      return res.status(404).json({ message: "❌ License or NID not found" });
    }

    res.status(500).json({ message: "Error registering pharmacy user" });
  }
};

exports.resetPharmacyAddress = async (req, res) => {

  try {
    const { prescriptionId } = req.body;
    await blockchainService.resetPharmacyAddress(prescriptionId);
    res.json({ message: "Pharmacy address reset successfully." });
  } catch (err) {
    res.status(500).send("Error resetting pharmacy address: " + err.message);
  }
};

exports.getAvailablePharmacies = async (req, res) => {
  try {
    const pharmacies = await Pharmacy.find({ isActive: true }).select(
      "pharmacy_name physicalAddress contactInfo nid"
    );
    res.status(200).json(pharmacies);
  } catch (err) {
    console.error("❌ Error retrieving pharmacies:", err.message);
    res.status(500).json({ message: "Error retrieving pharmacies" });
  }
};

exports.getPresbyPharmacyAddress = async (req, res) => {

  try {
    const { nid } = req.user; 

 
    const pharmacyUser = await PharmacyUser.findOne({ nid });
    if (!pharmacyUser) {
      return res.status(404).json({ message: "❌ Pharmacy user not found" });
    }

    const pharmacy = await Pharmacy.findOne({ nid: pharmacyUser.pharmacyNid });
    if (!pharmacy) {
      return res.status(404).json({ message: "❌ Pharmacy not found" });
    }

    console.log("🔍 Fetching prescriptions for pharmacy:", pharmacy.address);

    const prescriptions = await blockchainService.getPrescriptionsByPharmacy(
      pharmacy.address
    );

    const enrichedPrescriptions = await Promise.all(
      prescriptions.map(async (prescription) => {
        const doctor = await Doctor.findOne({ nid: prescription.doctorNid });
        return {
          ...prescription,
          doctorName: doctor ? doctor.name : "N/A",
          doctorSurname: doctor ? doctor.surname : "N/A",
          doctorLicense: doctor ? doctor.license : "N/A",
          doctorSpecialty: doctor ? doctor.specialty : "N/A",
        };
      })
    );

    res.status(200).json({
      message: "✅ Prescriptions retrieved successfully",
      prescriptions: enrichedPrescriptions,
    });
  } catch (err) {
    console.error("❌ Error fetching prescriptions for pharmacy:", err.message);
    res
      .status(500)
      .json({ message: "Error fetching prescriptions for pharmacy" });
  }
};


exports.getMedicationOptions = async (req, res) => {
  try {
    const { prescriptionId } = req.params;

    if (!prescriptionId) {
      return res
        .status(400)
        .json({ message: "❌ Prescription ID is required." });
    }

    const prescription = await blockchainService.getPrescriptionById(
      prescriptionId
    );
    if (!prescription) {
      return res
        .status(404)
        .json({ message: "❌ Prescription not found in blockchain." });
    }

    await MedicationCache.deleteMany({ prescriptionId, used: false });

    const medsRaw = [prescription.meds.med1, prescription.meds.med2].filter(
      (m) => m && m !== "N/A"
    );

    if (medsRaw.length === 0) {
      return res
        .status(400)
        .json({ message: "⚠️ No valid medication found in the prescription." });
    }

    const results = [];

    for (const medStr of medsRaw) {
      const [brandName, presentation, laboratory] = medStr
        .split(" + ")
        .map((s) => s.trim());

      const scraped = await medicationScraper.scrapeMedicationData(brandName);
      const filtered = scraped.filter(
        (m) =>
          m.brandName === brandName &&
          (!presentation || m.details.presentation === presentation) &&
          (!laboratory || m.details.laboratory === laboratory)
      );

      results.push(
        ...filtered.map((med) => ({ ...med, prescriptionId, used: false }))
      );
    }

    if (results.length === 0) {
      return res
        .status(404)
        .json({ message: "⚠️ No medication options found." });
    }

    const cachedMeds = await MedicationCache.insertMany(results);
    return res.json({ fromCache: false, results: cachedMeds });
  } catch (error) {
    console.error("❌ Error fetching medication options:", error);
    res.status(500).json({
      message: "Error fetching medication options",
      error: error.message,
    });
  }
};

exports.validatePrescription = async (req, res) => {
  try {
    const { prescriptionId, selectedMedicationIds } = req.body;
    const { nid } = req.user;

    if (
      !prescriptionId ||
      !selectedMedicationIds ||
      !Array.isArray(selectedMedicationIds)
    ) {
      return res.status(400).json({
        message: "❌ Prescription ID and medication selection are required.",
      });
    }

    const pharmacyUser = await PharmacyUser.findOne({ nid });
    if (!pharmacyUser)
      return res.status(404).json({ message: "❌ Pharmacy user not found." });

    const pharmacy = await Pharmacy.findOne({ nid: pharmacyUser.pharmacyNid });
    if (!pharmacy)
      return res.status(404).json({ message: "❌ Pharmacy not found." });

    const prescription = await blockchainService.getPrescriptionById(
      prescriptionId
    );
    if (!prescription)
      return res
        .status(404)
        .json({ message: "❌ Prescription not found in blockchain." });

    if (prescription.used)
      return res
        .status(400)
        .json({ message: "⚠️ Prescription is already used." });

    const currentTime = Math.floor(Date.now() / 1000);
    if (currentTime > prescription.expirationDate) {
      return res.status(400).json({ message: "⚠️ Prescription has expired." });
    }

    const selectedMedications = await MedicationCache.find({
      _id: { $in: selectedMedicationIds },
    });

    if (selectedMedications.length !== selectedMedicationIds.length) {
      return res
        .status(404)
        .json({ message: "❌ One or more selected medications not found." });
    }

    // saves the slected medication only
    await MedicationCache.updateMany(
      { _id: { $in: selectedMedicationIds } },
      { $set: { used: true } }
    );

    await MedicationCache.deleteMany({
      prescriptionId,
      used: false,
    });

    let finalPrices = [];

    for (const med of selectedMedications) {
      let insuranceCoverage = 0;

      try {
        const coverageResponse = await axios.post(
          verifyPrescription.url("/api/insurance/coverage"),
          {
            insurance_name: prescription.insurance.insuranceName,
            plan: prescription.insurance.insurancePlan,
            drug_name: med.genericName,
          }
        );

        insuranceCoverage = coverageResponse.data.coverage || 0;
      } catch (error) {
        return res.status(500).json({
          message: "Error fetching insurance coverage.",
          details: error.response?.data || error.message,
        });
      }

      const finalCoverage = insuranceCoverage;

      const quantity =
        med.brandName === prescription.meds.med1.split(" + ")[0]
          ? Number(prescription.meds.quantity1)
          : Number(prescription.meds.quantity2);

      // calculates gross total
      const grossPrice = med.price * quantity;

      // calculates final price (with coverage)
      const finalPrice = grossPrice * (1 - finalCoverage / 100);

      finalPrices.push({
        medication: med,
        quantity,
        grossPrice, 
        finalPrice,
        finalCoverage,
      });
    }

    return res
      .status(200)
      .json({ message: "✅ Prescription validated.", finalPrices });
  } catch (error) {
    console.error("❌ Error validating prescription:", error.message);
    return res.status(500).json({ message: "Error validating prescription." });
  }
};


exports.cancelPrescriptionValidation = async (req, res) => {

  try {
    const { prescriptionId } = req.body;
    if (!prescriptionId) {
      return res
        .status(400)
        .json({ message: "❌ Prescription ID is required." });
    }

    const { nid } = req.user; 
    const pharmacyUser = await PharmacyUser.findOne({ nid });
    if (!pharmacyUser) {
      return res.status(404).json({ message: "❌ Pharmacy user not found." });
    }

    const pharmacyNid = pharmacyUser.pharmacyNid;

    console.log(
      `🔄 Cancelling validation for prescription ID: ${prescriptionId} by pharmacy ${pharmacyNid}...`
    );


    const result = await blockchainService.clearPendingValidation(
      prescriptionId,
      pharmacyNid 
    );

    res.status(200).json({
      message:
        "✅ Prescription validation cancelled. Prescription is now available again.",
      transaction: result,
    });
  } catch (error) {
    console.error(
      "❌ Error cancelling prescription validation:",
      error.message
    );
    res
      .status(500)
      .json({ message: "Error cancelling prescription validation." });
  }
};


exports.processPurchase = async (req, res) => {
  console.log("📌 Body recibido:", req.body);

  try {
    const { prescriptionId, selectedMedications, totalAmount, finalPrices } = req.body;
    const { nid } = req.user;

    console.log(`🛒 Procesando compra para la receta ${prescriptionId}...`);

    if (!prescriptionId || !selectedMedications || selectedMedications.length === 0) {
      return res.status(400).json({ message: "❌ Prescription ID and medications are required." });
    }

    console.log(`🔍 Buscando receta en blockchain con ID: ${prescriptionId}`);
    const prescription = await blockchainService.getPrescriptionById(prescriptionId);
    if (!prescription) {
      console.log("❌ La receta no fue encontrada en la blockchain.");
      return res.status(404).json({ message: "❌ Prescription not found in blockchain." });
    }

    console.log(`✅ Receta encontrada: ${JSON.stringify(prescription)}`);

    console.log(`🔍 Buscando usuario de farmacia con NID: ${nid}`);
    const pharmacyUser = await PharmacyUser.findOne({ nid });
    if (!pharmacyUser) {
      console.log("❌ No se encontró el usuario de la farmacia.");
      return res.status(404).json({ message: "❌ Pharmacy user not found." });
    }

    console.log(`🔍 Buscando información de la farmacia con NID: ${pharmacyUser.pharmacyNid}`);
    const pharmacy = await Pharmacy.findOne({ nid: pharmacyUser.pharmacyNid });
    if (!pharmacy) {
      console.log("❌ No se encontró la farmacia.");
      return res.status(404).json({ message: "❌ Pharmacy not found." });
    }

    console.log(`✅ Farmacia encontrada: ${pharmacy.pharmacy_name}`);

    console.log(`🔍 Buscando información del médico con NID: ${prescription.doctorNid}`);
    const doctor = await Doctor.findOne({ nid: prescription.doctorNid });
    if (!doctor) {
      console.log("❌ No se encontró el médico.");
      return res.status(404).json({ message: "❌ Doctor not found." });
    }

    console.log(`✅ Médico encontrado: ${doctor.name} ${doctor.surname}`);

    // generates unique invoice number
    const invoiceNumber = `FACT-${new Date()
      .toISOString()
      .replace(/[-T:.Z]/g, "")
      .slice(0, 12)}-${Math.floor(Math.random() * 100000)}`;

    const blockchainResponse = await blockchainService.markPrescriptionAsUsed(
      prescriptionId,
      invoiceNumber,
      pharmacy.nid,
      pharmacyUser.nid
    );
    if (!blockchainResponse.success) {
      return res.status(500).json({ message: "❌ Failed to mark prescription as used." });
    }

    const invoiceMeds = finalPrices.map(item => ({
      name: item.medication.brandName,
      presentation: item.medication.details.presentation,
      laboratory: item.medication.details.laboratory,
      quantity: item.quantity,
      priceUnit: item.medication.price,
      grossPrice: item.grossPrice,   
      finalPrice: item.finalPrice,   
      coverage: item.finalCoverage
    }));

// simulate invoice
    const invoiceData = {
      invoiceNumber,
      prescriptionId,
      pharmacy: {
        name: pharmacy.pharmacy_name,
        cuit: pharmacy.nid,
        address: pharmacy.physicalAddress,
        contact: pharmacy.contactInfo,
      },
      patient: {
        dni: prescription.patientNid,
        name: prescription.patientName,
        surname: prescription.patientSurname,
        address: prescription.patientAddress,
      },
      doctor: {
        name: doctor.name,
        surname: doctor.surname,
        specialty: doctor.specialty,
        license: doctor.license,
      },
      medications: invoiceMeds,
      totalAmount,
    };

    const invoiceResponse = await axios.post(
       invoiceService.url("/api/invoice/generate"),
      invoiceData
    );
    console.log(`💰 Monto total enviado en factura: ${totalAmount}`);
    console.log("✅ Factura generada:", invoiceResponse.data);

    // saves additional validation + invoice data in db
    await PrescriptionValidation.findOneAndUpdate(
      { prescriptionId },
      {
        prescriptionId,
        validatedMeds: finalPrices, 
        invoiceData: invoiceResponse.data,
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      message: "✅ Purchase completed.",
      totalAmount,
      invoice: invoiceResponse.data,
      finalPrices,
    });
  } catch (error) {
    console.error("❌ Error processing purchase:", error);
    return res.status(500).json({ message: "Error processing purchase." });
  }
};


exports.getPharmacyUserProfile = async (req, res) => {
  try {
    const nid = req.user.nid;

    const pharmacyuser = await PharmacyUser.findOne({ nid }).select(
      "-password"
    );
    if (!pharmacyuser) {
      return res.status(404).json({ message: "❌ Pharmacy user not found" });
    }

    res.json(pharmacyuser);
  } catch (error) {
    console.error("❌ Error al obtener perfil del usuario de farmacia:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

exports.getPharmacyUsers = async (req, res) => {
  try {
    const pharmacy = await Pharmacy.findOne({ nid: req.user.nid });
    if (!pharmacy) {
      return res.status(401).json({ message: "❌ Unauthorized pharmacy" });
    }

    const users = await PharmacyUser.find({ pharmacyNid: pharmacy.nid }).select(
      "-password"
    );
    res.status(200).json(users);
  } catch (err) {
    console.error("❌ Error fetching pharmacy users:", err.message);
    res.status(500).json({ message: "Error fetching pharmacy users" });
  }
};

exports.getPharmacyProfile = async (req, res) => {
  try {
    const pharmacy = await Pharmacy.findOne({ nid: req.user.nid }).select(
      "-password"
    );
    if (!pharmacy) {
      return res.status(404).json({ message: "❌ Pharmacy not found" });
    }

    res.json(pharmacy);
  } catch (err) {
    console.error("❌ Error fetching pharmacy profile:", err.message);
    res.status(500).json({ message: "Error fetching pharmacy profile" });
  }
};

exports.getValidationData = async (req, res) => {
  try {
    const { prescriptionId } = req.params;

    if (!prescriptionId) {
      return res.status(400).json({ message: "❌ Prescription ID is required." });
    }

    const record = await PrescriptionValidation.findOne({ prescriptionId });

    if (!record) {
      return res.status(404).json({ message: "❌ No validation data found." });
    }

    res.status(200).json(record);
  } catch (err) {
    console.error("❌ Error fetching validation data:", err.message);
    res.status(500).json({ message: "Error fetching validation data." });
  }
};
