const bcrypt = require("bcrypt");
const { encrypt } = require("../utils/encryption");
const axios = require("axios");
const PharmacyUser = require("../models/PharmacyUser");
const Pharmacy = require("../models/Pharmacy");
const Doctor = require("../models/Doctor");
const { Web3 } = require("web3");
const blockchainService = require("../services/blockchainService");
const medicationScraper = require("../services/medicationScraper"); // Importa el scraper
const MedicationCache = require("../models/MedicationCache"); // Importamos el modelo de caché
const fundAccount = require("../utils/fundAccount");
const PrescriptionValidation = require("../models/PrescriptionValidation");

// ✅ Configuración de Web3
const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:7545"));

// 📌 Registrar Farmacia (Ruta Pública)
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

// 📌 Registrar Farmacia (Ruta Pública)
exports.registerPharmacy = async (req, res) => {
  const { nid, pharmacy_name, mail, password, physicalAddress, contactInfo } =
    req.body;

  try {
    // Validar campos requeridos
    if (!nid || !pharmacy_name || !mail || !password || !physicalAddress) {
      return res.status(400).send("❌ Missing required fields");
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);
    const account = web3.eth.accounts.create();
    const encryptedPrivateKey = encrypt(account.privateKey);

    // Generar código único para la farmacia
    const verificationCode = crypto.randomBytes(6).toString("hex");
    await fundAccount(account.address);

    // Crear la nueva farmacia
    const newPharmacy = new Pharmacy({
      nid,
      pharmacy_name,
      mail,
      password: hashedPassword,
      address: account.address, // Asignar dirección generada
      privateKey: encryptedPrivateKey,
      physicalAddress,
      contactInfo,
      verificationCode,
    });

    // Guardar en la base de datos
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
    // Validar campos requeridos
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

    // Buscar la farmacia en la base de datos
    const pharmacy = await Pharmacy.findOne({ nid: pharmacyNid });
    if (!pharmacy) {
      return res.status(404).json({ message: "Pharmacy not found" });
    }

    // Validar el código de verificación
    if (pharmacy.verificationCode !== verificationCode) {
      return res.status(400).json({ message: "❌ Invalid verification code" });
    }

    // ✅ Validar NID y matrícula con el servicio de verificación
    const verifyResponse = await axios.post(
      "http://verify_license:5000/verify",
      {
        nid,
        license,
        user_type: "pharmacist", // Tipo de usuario: farmacéutico
      },
      {
        headers: { Authorization: "Bearer securetoken123" }, // Token de autenticación
      }
    );

    if (!verifyResponse.data.valid) {
      return res.status(400).json({ message: "❌ Invalid license or NID" });
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear el nuevo usuario
    const newUser = new PharmacyUser({
      pharmacyNid,
      name,
      surname,
      nid,
      license,
      email,
      password: hashedPassword,
    });

    // Guardar el usuario en la base de datos
    await newUser.save();

    res
      .status(201)
      .json({ message: "✅ Pharmacy user registered successfully." });
  } catch (err) {
    console.error("❌ Error registering pharmacy user:", err.message);

    // Manejar errores del servicio de verificación
    if (err.response && err.response.status === 404) {
      return res.status(404).json({ message: "❌ License or NID not found" });
    }

    res.status(500).json({ message: "Error registering pharmacy user" });
  }
};

// 📌 Resetear dirección de farmacia en una receta específica YA NO SE USA CREO
exports.resetPharmacyAddress = async (req, res) => {
  try {
    const { prescriptionId } = req.body;
    await blockchainService.resetPharmacyAddress(prescriptionId);
    res.json({ message: "Pharmacy address reset successfully." });
  } catch (err) {
    res.status(500).send("Error resetting pharmacy address: " + err.message);
  }
};

// 📌 Obtener Lista de Farmacias
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

// 📌 Obtener Recetas Asignadas a la Farmacia
exports.getPresbyPharmacyAddress = async (req, res) => {
  try {
    const { nid } = req.user; // El NID del usuario logueado (usuario de la farmacia)

    // Buscar el usuario de la farmacia en la base de datos
    const pharmacyUser = await PharmacyUser.findOne({ nid });
    if (!pharmacyUser) {
      return res.status(404).json({ message: "❌ Pharmacy user not found" });
    }

    // Buscar la farmacia asociada al usuario
    const pharmacy = await Pharmacy.findOne({ nid: pharmacyUser.pharmacyNid });
    if (!pharmacy) {
      return res.status(404).json({ message: "❌ Pharmacy not found" });
    }

    console.log("🔍 Fetching prescriptions for pharmacy:", pharmacy.address);

    // Obtener las recetas desde la blockchain
    const prescriptions = await blockchainService.getPrescriptionsByPharmacy(
      pharmacy.address
    );

    // ✅ Obtener de cada receta la info del médico desde MongoDB
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

/*exports.getMedicationOptions = async (req, res) => {
  try {
    const { prescriptionId } = req.params;

    if (!prescriptionId) {
      return res.status(400).json({ message: "❌ Prescription ID is required." });
    }

    const prescription = await blockchainService.getPrescriptionById(prescriptionId);
    if (!prescription) {
      return res.status(404).json({ message: "❌ Prescription not found in blockchain." });
    }

    // 🧹 Limpiar opciones viejas NO usadas
    await MedicationCache.deleteMany({ prescriptionId, used: false });

    const medications = [prescription.meds.med1, prescription.meds.med2].filter(
      (med) => med && med !== "N/A"
    );

    if (medications.length === 0) {
      return res.status(400).json({ message: "⚠️ No valid medication found in the prescription." });
    }

    const results = (await Promise.all(
      medications.map((name) => medicationScraper.scrapeMedicationData(name))
    )).flat();

    if (results.length === 0) {
      return res.status(404).json({ message: "⚠️ No medication options found." });
    }

    // 📌 Insertar en cache
    const cachedMeds = await MedicationCache.insertMany(
      results.map((med) => ({
        ...med,
        prescriptionId,
        used: false
      }))
    );

    return res.json({ fromCache: false, results: cachedMeds });
  } catch (error) {
    console.error("❌ Error fetching medication options:", error);
    res.status(500).json({ message: "Error fetching medication options", error: error.message });
  }
};*/
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

    // 🔒 Confirmar uso y limpiar el resto
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
          "http://verify_prescription:5004/api/insurance/coverage",
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
      const finalPrice = med.price * (1 - finalCoverage / 100);

      finalPrices.push({ medication: med, finalPrice, finalCoverage });
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

    const { nid } = req.user; // faltaba esto -> NID del farmacéutico autenticado
    const pharmacyUser = await PharmacyUser.findOne({ nid });
    if (!pharmacyUser) {
      return res.status(404).json({ message: "❌ Pharmacy user not found." });
    }

    const pharmacyNid = pharmacyUser.pharmacyNid;

    console.log(
      `🔄 Cancelling validation for prescription ID: ${prescriptionId} by pharmacy ${pharmacyNid}...`
    );

    // 🔄 Llamar a `clearPendingValidation` en la blockchain
    const result = await blockchainService.clearPendingValidation(
      prescriptionId,
      pharmacyNid // faltaba esto
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

    // 📌 Obtener la receta desde la blockchain
    console.log(`🔍 Buscando receta en blockchain con ID: ${prescriptionId}`);
    const prescription = await blockchainService.getPrescriptionById(prescriptionId);
    if (!prescription) {
      console.log("❌ La receta no fue encontrada en la blockchain.");
      return res.status(404).json({ message: "❌ Prescription not found in blockchain." });
    }

    console.log(`✅ Receta encontrada: ${JSON.stringify(prescription)}`);

    // 📌 Buscar el usuario farmacéutico en la base de datos
    console.log(`🔍 Buscando usuario de farmacia con NID: ${nid}`);
    const pharmacyUser = await PharmacyUser.findOne({ nid });
    if (!pharmacyUser) {
      console.log("❌ No se encontró el usuario de la farmacia.");
      return res.status(404).json({ message: "❌ Pharmacy user not found." });
    }

    // 📌 Buscar la farmacia
    console.log(`🔍 Buscando información de la farmacia con NID: ${pharmacyUser.pharmacyNid}`);
    const pharmacy = await Pharmacy.findOne({ nid: pharmacyUser.pharmacyNid });
    if (!pharmacy) {
      console.log("❌ No se encontró la farmacia.");
      return res.status(404).json({ message: "❌ Pharmacy not found." });
    }

    console.log(`✅ Farmacia encontrada: ${pharmacy.pharmacy_name}`);

    // 📌 Buscar información del médico
    console.log(`🔍 Buscando información del médico con NID: ${prescription.doctorNid}`);
    const doctor = await Doctor.findOne({ nid: prescription.doctorNid });
    if (!doctor) {
      console.log("❌ No se encontró el médico.");
      return res.status(404).json({ message: "❌ Doctor not found." });
    }

    console.log(`✅ Médico encontrado: ${doctor.name} ${doctor.surname}`);

    // 🔹 Generar un número de factura único
    const invoiceNumber = `FACT-${new Date()
      .toISOString()
      .replace(/[-T:.Z]/g, "")
      .slice(0, 12)}-${Math.floor(Math.random() * 100000)}`;

    // 🔹 Marcar receta como usada en blockchain
    const blockchainResponse = await blockchainService.markPrescriptionAsUsed(
      prescriptionId,
      invoiceNumber,
      pharmacy.nid,
      pharmacyUser.nid
    );
    if (!blockchainResponse.success) {
      return res.status(500).json({ message: "❌ Failed to mark prescription as used." });
    }

    // 🔹 Generar factura simulada
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
      medications: selectedMedications,
      totalAmount,
    };

    const invoiceResponse = await axios.post(
      "http://invoice_service:5005/api/invoice/generate",
      invoiceData
    );
    console.log(`💰 Monto total enviado en factura: ${totalAmount}`);
    console.log("✅ Factura generada:", invoiceResponse.data);

    // 🔹 Guardar validación y factura en MongoDB
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


// 📌 Obtener el perfil del farmaceutico autenticado
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
