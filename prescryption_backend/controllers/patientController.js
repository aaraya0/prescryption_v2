const bcrypt = require("bcrypt");
const Patient = require("../models/Patient");
const blockchainService = require("../services/blockchainService");
const Pharmacy = require("../models/Pharmacy");
const Doctor = require("../models/Doctor");
const { Web3 } = require("web3");
const axios = require("axios");

const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:7545"));

exports.registerPatient = async (req, res) => {
  const {
    name,
    surname,
    nid,
    birth_date,
    sex,
    insurance_name,
    password,
    mail,
  } = req.body;

  if (
    !name ||
    !surname ||
    !nid ||
    !birth_date ||
    !sex ||
    !insurance_name ||
    !password ||
    !mail
  ) {
    return res.status(400).json({ message: "❌ Missing required fields" });
  }

  let affiliate_num = "N/A"; // default value for patients w/o insurance
  let insurance_plan = "PARTICULAR"; 

  if (insurance_name && insurance_name !== "PARTICULAR") {
    try {
      // API request
      const response = await axios.post(
        "http://verify_insurance:5003/get_affiliation",
        { nid, insurance_name }
      );

      if (response.data.status === "not_found") {
        return res.status(400).json({
          message:
            "⚠️ Patient is not affiliated with this insurance. Choose 'PARTICULAR' to continue.",
        });
      }
      affiliate_num = response.data.affiliate_number;
      insurance_plan = response.data.insurance_plan;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return res.status(400).json({
          message:
            "⚠️ Patient is not found in the insurance database. Choose 'PARTICULAR' to continue.",
        });
      }
      console.error("❌ Error validating patient:", error.message);
      return res.status(500).json({ message: "Error validating patient" });
    }
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const account = web3.eth.accounts.create();
    const newPatient = new Patient({
      name,
      surname,
      nid,
      birth_date,
      sex,
      insurance_name: insurance_name || "PARTICULAR",
      affiliate_num,
      insurance_plan,
      mail,
      password: hashedPassword,
      address: account.address,
    });

    await newPatient.save();

    res.status(201).json({ message: "✅ Patient registered successfully." });
  } catch (error) {
    console.error("❌ Error registering patient:", error.message);
    res.status(500).json({ message: "Error registering patient" });
  }
};


exports.getPresbyPatientAddress = async (req, res) => {
  try {
    const nid = req.user.nid;
    const patient = await Patient.findOne({ nid });
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    const patientAddress = patient.address;
    if (!patientAddress)
      return res.status(400).json({ message: "Patient address not available" });

    let prescriptions = [];
    try {
      prescriptions = await blockchainService.getPrescriptionsByPatient(
        patientAddress
      );
    } catch (blockchainError) {
      console.warn(
        "⚠️ No se pudieron obtener recetas del blockchain:",
        blockchainError.message
      );
      prescriptions = [];
    }

    const enrichedPrescriptions = await Promise.all(
      prescriptions.map(async (prescription) => {
        const doctor = await Doctor.findOne({ nid: prescription.doctorNid });
        return {
          ...prescription,
          doctorName: doctor ? doctor.name : "N/A",
          doctorSurname: doctor ? doctor.surname : "N/A",
          doctorSpecialty: doctor ? doctor.specialty : "N/A",
          doctorLicense: doctor ? doctor.license : "N/A",
        };
      })
    );

    res.json(enrichedPrescriptions);
  } catch (err) {
    console.error("❌ Error retrieving prescriptions:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.sendPrescriptionToPharmacy = async (req, res) => {
  const { prescriptionId, pharmacyNid } = req.body;

  try {
   
    if (!prescriptionId || !pharmacyNid) {
      return res.status(400).json({ message: "❌ Missing required fields" });
    }

    const pharmacy = await Pharmacy.findOne({ nid: pharmacyNid });
    if (!pharmacy) {
      return res.status(404).json({ message: "❌ Pharmacy not found" });
    }

    const result = await blockchainService.updatePrescriptionPharmacyAddress(
      prescriptionId,
      pharmacy.address
    );

    res
      .status(200)
      .json({
        message: "✅ Prescription sent to pharmacy successfully",
        result,
      });
  } catch (err) {
    console.error("❌ Error sending prescription to pharmacy:", err.message);
    res.status(500).json({ message: "Error sending prescription to pharmacy" });
  }
};

exports.getPatientProfile = async (req, res) => {
  try {
    const nid = req.user.nid;
    const patient = await Patient.findOne({ nid }).select("-password"); 
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    res.json(patient);
  } catch (err) {
    console.error("❌ Error retrieving patient profile:", err.message);
    res.status(500).json({ message: "Server error" });
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
