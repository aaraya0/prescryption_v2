const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Insurance = require("../models/Insurance");
const Doctor = require("../models/Doctor");
const blockchainService = require("../services/blockchainService");

// ✅ Registro
exports.registerInsurance = async (req, res) => {
  try {
    const { insurance_name, insurance_nid, password, mail } = req.body;

    if (!insurance_name || !insurance_nid || !password || !mail) {
      return res.status(400).json({ message: "❌ All fields are required" });
    }

    const existing = await Insurance.findOne({ insurance_nid });
    if (existing) {
      return res
        .status(409)
        .json({ message: "❌ Insurance already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newInsurance = new Insurance({
      insurance_name,
      insurance_nid,
      password: hashedPassword,
      mail,
    });

    await newInsurance.save();
    res
      .status(201)
      .json({ message: "✅ Registration submitted. Awaiting verification." });
  } catch (err) {
    console.error("❌ Error in registration:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Login
exports.loginInsurance = async (req, res) => {
  try {
    const { insurance_nid, password } = req.body;

    const insurance = await Insurance.findOne({ insurance_nid });
    if (!insurance)
      return res.status(404).json({ message: "❌ Insurance not found" });

    if (!insurance.isVerified) {
      return res
        .status(403)
        .json({ message: "❌ Your account is pending admin verification." });
    }

    const validPass = await bcrypt.compare(password, insurance.password);
    if (!validPass)
      return res.status(401).json({ message: "❌ Invalid credentials" });

    const token = jwt.sign(
      { insurance_nid: insurance.insurance_nid, userType: "insurance" },
      process.env.SECRET_KEY,
      { expiresIn: "1h" }
    );

    res.status(200).json({ message: "✅ Login successful", token });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Ver recetas usadas
exports.getUsedPrescriptionsByInsurance = async (req, res) => {
  try {
    const { insurance_nid } = req.user;

    // 🔍 Buscar el nombre de la obra social a partir de su NID
    const insurance = await Insurance.findOne({ insurance_nid });
    if (!insurance) {
      return res.status(404).json({ message: "❌ Insurance not found" });
    }

    const insuranceName = insurance.insurance_name.trim().toLowerCase();

    // 📦 Obtener todas las recetas desde blockchain
    const prescriptions = await blockchainService.getAllPrescriptions();

    // 📌 Filtrar recetas usadas que pertenecen a esta obra social
    const filtered = prescriptions.filter(
      (p) =>
        p.used &&
        p.insurance &&
        p.insurance.insuranceName &&
        p.insurance.insuranceName.trim().toLowerCase() === insuranceName
    );

    // ✅ Obtenemos datos del médico de la base de Datos
    const enrichedPrescriptions = await Promise.all(
      filtered.map(async (prescription) => {
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
      message: "✅ Used prescriptions fetched",
      prescriptions: enrichedPrescriptions,
    });

    res.status(200).json({
      message: "✅ Used prescriptions fetched",
      prescriptions: filtered,
    });
  } catch (err) {
    console.error("❌ Error fetching prescriptions:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getInsuranceProfile = async (req, res) => {
  try {
    const nid = req.user.insurance_nid;
    const insurance = await Insurance.findOne({ insurance_nid: nid }).select(
      "-password"
    );
    if (!insurance)
      return res.status(404).json({ message: "Insurance not found" });

    res.json(insurance);
  } catch (err) {
    console.error("❌ Error retrieving insurance profile:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};
