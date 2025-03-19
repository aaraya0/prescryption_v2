const Insurance = require('../models/Insurance');
const blockchainService = require('../services/blockchainService');

// Obtener perfil de usuario de obra social
exports.getUserProfile = async (req, res) => {
    try {
        const { nid } = req.user;
        const insurance = await Insurance.findOne({ nid });
        if (!insurance) {
            return res.status(404).send('Insurance provider not found.');
        }
        res.json(insurance);
    } catch (err) {
        res.status(500).send('Error fetching profile: ' + err.message);
    }
};

const bcrypt = require("bcryptjs");
const Insurance = require("../models/Insurance");

exports.registerInsurance = async (req, res) => {
    try {
        const { insurance_name, insurance_nid, password, mail } = req.body;

        console.log(`🔍 Intentando registrar obra social: ${insurance_name} (NID: ${insurance_nid})`);

        // 📌 Verificar que todos los campos estén completos
        if (!insurance_name || !insurance_nid || !password || !mail) {
            return res.status(400).json({ message: "❌ Todos los campos son obligatorios." });
        }

        // 📌 Verificar si el `insurance_nid` ya está registrado
        const existingInsurance = await Insurance.findOne({ insurance_nid });
        if (existingInsurance) {
            return res.status(400).json({ message: "❌ La obra social ya está registrada." });
        }

        // 📌 Hashear la contraseña antes de guardarla
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 📌 Crear la nueva obra social
        const newInsurance = new Insurance({
            insurance_name,
            insurance_nid,
            password: hashedPassword,
            mail
        });

        // 📌 Guardar en la base de datos
        await newInsurance.save();
        console.log(`✅ Obra social registrada exitosamente: ${insurance_name}`);

        res.status(201).json({ message: "✅ Registro exitoso.", insurance_name, insurance_nid });

    } catch (error) {
        console.error("❌ Error en el registro:", error.message);
        res.status(500).json({ message: "Error en el registro." });
    }
};
