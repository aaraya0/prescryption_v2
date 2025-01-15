const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const PharmacyUser = require('../models/PharmacyUser'); // Cambiado a PharmacyUser
const Insurance = require('../models/Insurance');
require('dotenv').config();

// 📌 Login General (Paciente, Médico, Usuario de Farmacia, Insurance)
exports.login = async (req, res) => {
    const { nid, password, userType } = req.body;

    try {
        if (!nid || !password || !userType) {
            return res.status(400).send('❌ Missing required fields');
        }

        let user;

        switch (userType) {
            case 'patient':
                user = await Patient.findOne({ nid });
                break;
            case 'doctor':
                user = await Doctor.findOne({ nid });
                break;
            case 'pharmacyUser': // Cambiado a usuario de farmacia
                user = await PharmacyUser.findOne({ nid });
                break;
            case 'insurance':
                user = await Insurance.findOne({ nid });
                break;
            default:
                return res.status(400).send('❌ Invalid user type');
        }

        if (!user) {
            return res.status(401).send('❌ User not found');
        }

        // Validar si el usuario está activo
        if (userType === 'pharmacyUser' && !user.isActive) {
            return res.status(403).send('❌ User is inactive');
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).send('❌ Invalid credentials');
        }

        // Generar token JWT
        const token = jwt.sign(
            {
                nid: user.nid,
                userType,
                pharmacyNid: userType === 'pharmacyUser' ? user.pharmacyNid : null // Si es usuario de farmacia, incluir su farmacia
            },
            process.env.SECRET_KEY,
            { expiresIn: '1h' }
        );

        res.json({
            message: '✅ Login successful',
            token
        });
    } catch (err) {
        console.error('❌ Error during login:', err.message);
        res.status(500).send('Error during login');
    }
};
