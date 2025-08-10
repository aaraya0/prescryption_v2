const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const AdminUser = require("../models/AdminUser");
const Insurance = require("../models/Insurance");

exports.loginAdmin = async (req, res) => {
    try {
        const { nid, password } = req.body;

        const admin = await AdminUser.findOne({ nid });
        if (!admin) return res.status(404).json({ message: "❌ Admin not found" });

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) return res.status(401).json({ message: "❌ Invalid credentials" });

        const token = jwt.sign(
            { nid: admin.nid, userType: "admin" },
            process.env.SECRET_KEY,
            { expiresIn: "1h" }
        );

        res.status(200).json({ message: "✅ Login successful", token });
    } catch (err) {
        console.error("❌ Login error:", err.message);
        res.status(500).json({ message: "Server error" });
    }
};

exports.getPendingInsurances = async (req, res) => {
    try {
        const insurances = await Insurance.find({ isVerified: false });
        res.status(200).json({ pending: insurances });
    } catch (err) {
        res.status(500).json({ message: "Error fetching pending insurances" });
    }
};

exports.verifyInsurance = async (req, res) => {
    try {
        const { insurance_nid } = req.params;
        const insurance = await Insurance.findOne({ insurance_nid });

        if (!insurance) {
            return res.status(404).json({ message: "❌ Insurance not found" });
        }

        if (insurance.isVerified) {
            return res.status(400).json({ message: "⚠️ Insurance already verified" });
        }

        insurance.isVerified = true;
        await insurance.save();

        res.status(200).json({ message: "✅ Insurance verified successfully" });
    } catch (err) {
        res.status(500).json({ message: "Error verifying insurance" });
    }
};
