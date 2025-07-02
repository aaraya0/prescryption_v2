//📁 backend/controllers/passwordController.js
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");
const PharmacyUser = require("../models/PharmacyUser");
const Pharmacy = require("../models/Pharmacy");
const Insurance = require("../models/Insurance");
const AdminUser = require("../models/AdminUser");
require("dotenv").config();

const getModel = (userType) => {
  return {
    patient: Patient,
    doctor: Doctor,
    pharmacyUser: PharmacyUser,
    pharmacy: Pharmacy,
    insurance: Insurance,
    admin: AdminUser,
  }[userType];
};

exports.forgotPassword = async (req, res) => {
  const { nid, userType } = req.body;
  const User = getModel(userType);
  if (!User) return res.status(400).send("❌ Tipo de usuario inválido");

  const user = await User.findOne({ nid });
  if (!user) return res.status(200).send("✅ Si el usuario existe, se envió el mail");

  const token = jwt.sign({ nid, userType }, process.env.SECRET_KEY, { expiresIn: "15m" });

  const resetLink = `http://localhost:3000/reset-password?token=${token}`;

  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: "Prescryption <no-reply@prescryption.com>",
    to: user.mail,
    subject: "Recuperación de contraseña",
    html: `<p>Hacé clic <a href="${resetLink}">aquí</a> para restablecer tu contraseña. El enlace expirará en 15 minutos.</p>`
  });

  res.send("✅ Si el usuario existe, se envió el mail");
};

exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const { nid, userType } = jwt.verify(token, process.env.SECRET_KEY);
    const User = getModel(userType);
    const user = await User.findOne({ nid });
    if (!user) return res.status(404).send("❌ Usuario no encontrado");

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.send("✅ Contraseña actualizada correctamente");
  } catch (err) {
    res.status(400).send("❌ Token inválido o expirado");
  }
};
