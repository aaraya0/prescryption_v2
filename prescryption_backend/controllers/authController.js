const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const PharmacyUser = require('../models/PharmacyUser');
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
        let userIdentifier = "nid"; // Clave por defecto para búsqueda en DB

        switch (userType) {
            case 'patient':
                user = await Patient.findOne({ nid });
                break;
            case 'doctor':
                user = await Doctor.findOne({ nid });
                break;
            case 'pharmacyUser':
                user = await PharmacyUser.findOne({ nid });
                break;
            case 'insurance':
                userIdentifier = "insurance_nid"; // 📌 Cambiar clave para buscar en `Insurance`
                user = await Insurance.findOne({ insurance_nid: nid });
                break;
            default:
                return res.status(400).send('❌ Invalid user type');
        }

        if (!user) {
            return res.status(401).send('❌ User not found');
        }

        // 📌 Validar si el usuario de farmacia está activo
        if (userType === 'pharmacyUser' && !user.isActive) {
            return res.status(403).send('❌ User is inactive');
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).send('❌ Invalid credentials');
        }

        // 📌 Generar token JWT con datos específicos para cada tipo de usuario
        const tokenPayload = {
            nid: user.nid,
            userType
        };

        // Si el usuario es de farmacia, incluir `pharmacyNid`
        if (userType === 'pharmacyUser') {
            tokenPayload.pharmacyNid = user.pharmacyNid;
        }

        // Si el usuario es una obra social, incluir `insurance_nid`
        if (userType === 'insurance') {
            tokenPayload.insurance_nid = user.insurance_nid;
        }

        const token = jwt.sign(tokenPayload, process.env.SECRET_KEY, { expiresIn: '1h' });

        res.json({
            message: '✅ Login successful',
            token,
            debug: tokenPayload // 📌 Agrega esto para verificar los datos en el token
        });
        
    } catch (err) {
        console.error('❌ Error during login:', err.message);
        res.status(500).send('Error during login');
    }
};
