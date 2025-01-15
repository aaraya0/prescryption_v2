const bcrypt = require('bcrypt');
const axios = require('axios');
const PharmacyUser = require('../models/PharmacyUser');
const Pharmacy = require('../models/Pharmacy');
const { Web3 } = require('web3');

// ✅ Configuración de Web3
const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:7545"));

// 📌 Registrar Farmacia (Ruta Pública)
const crypto = require('crypto');


exports.deactivatePharmacyUser = async (req, res) => {
    const { userId } = req.params; // Obtener el userId de los parámetros de la URL

    try {
        // Buscar al usuario logueado en la base de datos
        const loggedInUser = await PharmacyUser.findOne({ nid: req.user.nid });
        if (!loggedInUser) {
            return res.status(401).json({ message: '❌ User not found or not authorized' });
        }

        // Verificar si el usuario logueado es "admin"
        if (loggedInUser.role !== 'admin') {
            return res.status(403).json({ message: '❌ Access denied. Admin role required.' });
        }

        // Buscar al usuario a desactivar
        const user = await PharmacyUser.findById(userId);
        if (!user) {
            return res.status(404).json({ message: '❌ User to deactivate not found' });
        }

        user.isActive = false; // Desactivar el usuario
        await user.save();

        res.status(200).json({ message: '✅ User deactivated successfully.' });
    } catch (err) {
        console.error('❌ Error deactivating user:', err.message);
        res.status(500).json({ message: 'Error deactivating user' });
    }
};


exports.activatePharmacyUser = async (req, res) => {
    const { userId } = req.params;

    try {
        // Buscar al usuario logueado en la base de datos
        const loggedInUser = await PharmacyUser.findOne({ nid: req.user.nid });
        if (!loggedInUser) {
            return res.status(401).json({ message: '❌ User not found or not authorized' });
        }

        // Verificar si el usuario logueado es "admin"
        if (loggedInUser.role !== 'admin') {
            return res.status(403).json({ message: '❌ Access denied. Admin role required.' });
        }

        // Buscar al usuario a reactivar
        const user = await PharmacyUser.findById(userId);
        if (!user) {
            return res.status(404).json({ message: '❌ User to activate not found' });
        }

        user.isActive = true; // Reactivar el usuario
        await user.save();

        res.status(200).json({ message: '✅ User activated successfully.' });
    } catch (err) {
        console.error('❌ Error activating user:', err.message);
        res.status(500).json({ message: 'Error activating user' });
    }
};




// 📌 Registrar Farmacia (Ruta Pública)
exports.registerPharmacy = async (req, res) => {
    const {
        nid,
        pharmacy_name,
        mail,
        password,
        physicalAddress,
        contactInfo
    } = req.body;

    try {
        // Validar campos requeridos
        if (!nid || !pharmacy_name || !mail || !password || !physicalAddress) {
            return res.status(400).send('❌ Missing required fields');
        }

        // Hashear la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generar dirección Ethereum
        const account = web3.eth.accounts.create();

        // Generar código único para la farmacia
        const verificationCode = crypto.randomBytes(6).toString('hex');

        // Crear la nueva farmacia
        const newPharmacy = new Pharmacy({
            nid,
            pharmacy_name,
            mail,
            password: hashedPassword,
            address: account.address, // Asignar dirección generada
            physicalAddress,
            contactInfo,
            verificationCode
        });

        // Guardar en la base de datos
        await newPharmacy.save();

        res.status(201).json({
            message: '✅ Pharmacy registered successfully.',
            verificationCode
        });
    } catch (err) {
        console.error('❌ Error registering pharmacy:', err.message);
        res.status(500).send('Error registering pharmacy');
    }
};

exports.registerPharmacyUser = async (req, res) => {
    const { pharmacyNid, name, surname, nid, license, email, password, verificationCode, role } = req.body;

    try {
        // Validar campos requeridos
        if (!pharmacyNid || !name || !surname || !nid || !license || !email || !password || !verificationCode) {
            return res.status(400).json({ message: '❌ Missing required fields' });
        }

        // Buscar la farmacia en la base de datos
        const pharmacy = await Pharmacy.findOne({ nid: pharmacyNid });
        if (!pharmacy) {
            return res.status(404).json({ message: 'Pharmacy not found' });
        }

        // Validar el código de verificación
        if (pharmacy.verificationCode !== verificationCode) {
            return res.status(400).json({ message: '❌ Invalid verification code' });
        }

        // ✅ Validar NID y matrícula con el servicio de verificación
        const verifyResponse = await axios.post(
            'http://localhost:5000/verify',
            {
                nid,
                license,
                user_type: "pharmacist" // Tipo de usuario: farmacéutico
            },
            {
                headers: { Authorization: "Bearer securetoken123" } // Token de autenticación
            }
        );

        if (!verifyResponse.data.valid) {
            return res.status(400).json({ message: '❌ Invalid license or NID' });
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
            role: role || 'employee' // Si no se pasa el rol, se asigna por defecto "employee"
        });

        // Guardar el usuario en la base de datos
        await newUser.save();

        res.status(201).json({ message: '✅ Pharmacy user registered successfully.' });
    } catch (err) {
        console.error('❌ Error registering pharmacy user:', err.message);

        // Manejar errores del servicio de verificación
        if (err.response && err.response.status === 404) {
            return res.status(404).json({ message: '❌ License or NID not found' });
        }

        res.status(500).json({ message: 'Error registering pharmacy user' });
    }
};





// 📌 Obtener recetas por dirección de farmacia
exports.getPresbyPharmacyAddress = async (req, res) => {
    try {
        const { nid } = req.user;
        const pharmacy = await Pharmacy.findOne({ nid });
        if (!pharmacy) {
            return res.status(404).send('Pharmacy not found.');
        }
        const prescriptions = await blockchainService.getPrescriptionsByPharmacy(pharmacy.address);
        res.json(prescriptions);
    } catch (err) {
        res.status(500).send('Error fetching prescriptions: ' + err.message);
    }
};

// 📌 Enviar receta a farmacia
exports.sendPrescriptionToPharmacy = async (req, res) => {
    try {
        const { alias, prescriptionId } = req.body;
        const pharmacy = await Pharmacy.findOne({ alias });
        if (!pharmacy) {
            return res.status(404).send('Pharmacy not found.');
        }
        const result = await blockchainService.sendPrescriptionToPharmacy(prescriptionId, pharmacy.address);
        res.json(result);
    } catch (err) {
        res.status(500).send('Error sending prescription: ' + err.message);
    }
};

// 📌 Validar receta
exports.validatePrescription = async (req, res) => {
    try {
        const { prescriptionId, brand1, brand2 } = req.body;
        const validationResult = await blockchainService.validatePrescription(prescriptionId, brand1, brand2);
        res.json(validationResult);
    } catch (err) {
        res.status(500).send('Error validating prescription: ' + err.message);
    }
};

// 📌 Generar factura y marcar receta como usada
exports.generateInvoiceAndMarkUsed = async (req, res) => {
    try {
        const { prescriptionId, patientName, validatedMeds } = req.body;
        const invoice = await invoiceService.generateInvoice(prescriptionId, patientName, validatedMeds);
        await blockchainService.markPrescriptionAsUsed(prescriptionId, invoice.invoiceNumber);
        res.json({ message: 'Invoice generated and prescription marked as used', invoice });
    } catch (err) {
        res.status(500).send('Error generating invoice: ' + err.message);
    }
};

// 📌 Resetear dirección de farmacia en una receta específica
exports.resetPharmacyAddress = async (req, res) => {
    try {
        const { prescriptionId } = req.body;
        await blockchainService.resetPharmacyAddress(prescriptionId);
        res.json({ message: 'Pharmacy address reset successfully.' });
    } catch (err) {
        res.status(500).send('Error resetting pharmacy address: ' + err.message);
    }
};
