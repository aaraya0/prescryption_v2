const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");
const PharmacyUser = require("../models/PharmacyUser");
const Pharmacy = require("../models/Pharmacy");
const Insurance = require("../models/Insurance");
const AdminUser = require("../models/AdminUser");
require("dotenv").config();

exports.login = async (req, res) => {
  const { nid, password, userType } = req.body;

  try {
    if (!nid || !password || !userType) {
      return res.status(400).send("❌ Missing required fields");
    }

    let user;
    let userIdentifier = "nid";

    switch (userType) {
      case "patient":
        user = await Patient.findOne({ nid });
        break;
      case "doctor":
        user = await Doctor.findOne({ nid });
        break;
      case "pharmacyUser":
        user = await PharmacyUser.findOne({ nid });
        break;
      case "pharmacy":
        user = await Pharmacy.findOne({ nid });
        break;
      case "insurance":
        userIdentifier = "insurance_nid";
        user = await Insurance.findOne({ insurance_nid: nid });
        break;
      case "admin":
        user = await AdminUser.findOne({ nid });
        break;
      default:
        return res.status(400).send("❌ Invalid user type");
    }

    if (!user) {
      return res.status(401).send("❌ User not found");
    }

    if (userType === "insurance") {
      const verified =
        user.isVerified === true ||
        user.IsVerified === true ||
        user.status === "verified";
      if (!verified) {
        return res.status(403).send("❌ Insurance not verified");
      }
    }

    // validates if pharmacyUser is active
    if (userType === "pharmacyUser" && !user.isActive) {
      return res.status(403).send("❌ User is inactive");
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).send("❌ Invalid credentials");
    }

    // specific token for each user type
    const tokenPayload = {
      nid: user.nid,
      userType,
    };

    if (userType === "pharmacyUser") {
      tokenPayload.pharmacyNid = user.pharmacyNid;
    }

    if (userType === "insurance") {
      tokenPayload.insurance_nid = user.insurance_nid;
    }

    const token = jwt.sign(tokenPayload, process.env.SECRET_KEY, {
      expiresIn: "1h",
    });

    res.json({
      message: "✅ Login successful",
      token,
      debug: tokenPayload,
    });
  } catch (err) {
    console.error("❌ Error during login:", err.message);
    res.status(500).send("Error during login");
  }
};
