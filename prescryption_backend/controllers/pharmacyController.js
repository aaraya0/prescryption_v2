const bcrypt = require('bcrypt');
const axios = require('axios');
const PharmacyUser = require('../models/PharmacyUser');
const Pharmacy = require('../models/Pharmacy');
const { Web3 } = require('web3');
const blockchainService = require('../services/blockchainService');
const { scrapeMedicationData } = require("../services/medicationScraper");
const prescriptionContract = require("../services/blockchainService"); // Importa el contrato
const medicationScraper = require("../services/medicationScraper"); // Importa el scraper
const MedicationCache = require('../models/MedicationCache'); // Importamos el modelo de caché

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



// 📌 Obtener Lista de Farmacias
exports.getAvailablePharmacies = async (req, res) => {
    try {
        const pharmacies = await Pharmacy.find({ isActive: true }).select('pharmacy_name physicalAddress contactInfo nid');
        res.status(200).json(pharmacies);
    } catch (err) {
        console.error('❌ Error retrieving pharmacies:', err.message);
        res.status(500).json({ message: 'Error retrieving pharmacies' });
    }
};



// 📌 Obtener Recetas Asignadas a la Farmacia
exports.getPresbyPharmacyAddress = async (req, res) => {
    try {
        const { nid } = req.user; // El NID del usuario logueado (usuario de la farmacia)

        // Buscar el usuario de la farmacia en la base de datos
        const pharmacyUser = await PharmacyUser.findOne({ nid });
        if (!pharmacyUser) {
            return res.status(404).json({ message: '❌ Pharmacy user not found' });
        }

        // Buscar la farmacia asociada al usuario
        const pharmacy = await Pharmacy.findOne({ nid: pharmacyUser.pharmacyNid });
        if (!pharmacy) {
            return res.status(404).json({ message: '❌ Pharmacy not found' });
        }

        console.log('🔍 Fetching prescriptions for pharmacy:', pharmacy.address);

        // Obtener las recetas desde la blockchain
        const prescriptions = await blockchainService.getPrescriptionsByPharmacy(pharmacy.address);

        res.status(200).json({ message: '✅ Prescriptions retrieved successfully', prescriptions });
    } catch (err) {
        console.error('❌ Error fetching prescriptions for pharmacy:', err.message);
        res.status(500).json({ message: 'Error fetching prescriptions for pharmacy' });
    }
};


exports.validatePrescription = async (req, res) => {
    const { prescriptionId, selectedBrand } = req.body;

    try {
        // 📌 Validar que la receta existe
        const prescription = await prescriptionContract.methods.getPrescriptionById(prescriptionId).call();
        if (!prescription) {
            return res.status(404).json({ message: "❌ Prescription not found." });
        }

        // 🔍 Obtener lista de medicamentos con el scraper
        const medicationOptions = await scrapeMedicationData(prescription.meds.med1);
        if (!medicationOptions || medicationOptions.length === 0) {
            return res.status(404).json({ message: "⚠️ No medication options available." });
        }

        // ✅ Buscar la opción seleccionada
        const selectedMedication = medicationOptions.find(med => 
            med.name.toLowerCase().includes(selectedBrand.toLowerCase())
        );

        if (!selectedMedication) {
            return res.status(400).json({ message: "❌ Selected medication not found in available options." });
        }

        // 🏥 Consultar la API de la obra social para verificar cobertura
        const coverageResponse = await axios.post("http://localhost:5004/insurance/coverage", {
            insuranceName: prescription.insurance.insuranceName,
            plan: prescription.insurance.insurancePlan,
            drugName: prescription.meds.med1
        });

        if (coverageResponse.data.status === "not_covered") {
            return res.status(400).json({ message: "⚠️ This medication is not covered by the insurance." });
        }

        const coveragePercentage = coverageResponse.data.coverage;
        const finalPrice = selectedMedication.price * (1 - coveragePercentage / 100);

        // 🔄 Actualizar estado en la blockchain como validado
        await prescriptionContract.methods.markPrescriptionAsUsed(prescriptionId, "invoice123").send({
            from: "0xYourPharmacyWallet",
            gas: "2000000"
        });

        return res.status(200).json({
            message: "✅ Prescription validated successfully.",
            medication: selectedMedication,
            finalPrice: finalPrice.toFixed(2),
            coveragePercentage,
        });

    } catch (error) {
        console.error("❌ Error validating prescription:", error.message);
        return res.status(500).json({ message: "Error validating prescription." });
    }
};

exports.getMedicationOptions = async (req, res) => {
    try {
        const { prescriptionId } = req.params;

        console.log(`🔍 Searching medication options for prescription ID: ${prescriptionId}`);

        if (!prescriptionId) {
            return res.status(400).json({ message: "❌ Prescription ID is required." });
        }

        console.log("🛠️ Fetching prescription from blockchain...");

        // 📌 Obtener la receta desde la blockchain
        const prescription = await blockchainService.getPrescriptionById(prescriptionId);

        if (!prescription) {
            return res.status(404).json({ message: "❌ Prescription not found in blockchain." });
        }

        console.log(`✅ Prescription retrieved:`, prescription);

        // 📌 Obtener el nombre del medicamento (si tiene marca, usarla; si es genérico, usar el principio activo)
        const drugName = prescription.meds.med1 || prescription.meds.med2;

        if (!drugName) {
            return res.status(400).json({ message: "⚠️ No medication found in the prescription." });
        }

        console.log(`🔍 Fetching medication options for: ${drugName}`);

        // 📌 Buscar en caché
        const cachedMedication = await MedicationCache.findOne({ drugName });

        if (cachedMedication) {
            const diffInDays = (Date.now() - cachedMedication.lastUpdated) / (1000 * 60 * 60 * 24);
            if (diffInDays < 7) {
                console.log("✅ Using cached data.");
                return res.json({ fromCache: true, results: cachedMedication.results });
            } else {
                console.log("⚠️ Cache is outdated, fetching new data...");
            }
        }

        // 📌 Realizar scraping si la caché no es válida o no existe
        const scrapedResults = await medicationScraper.scrapeMedicationData(drugName);

        if (!scrapedResults || scrapedResults.length === 0) {
            return res.status(404).json({ message: "⚠️ No medication options found." });
        }

        // 📌 Limitar resultados a 15 medicamentos
        const limitedResults = scrapedResults.slice(0, 15);

        // 📌 Guardar en caché
        await MedicationCache.findOneAndUpdate(
            { drugName },
            { results: limitedResults, lastUpdated: Date.now() },
            { upsert: true } // Inserta si no existe, actualiza si ya está
        );

        res.json({ fromCache: false, results: limitedResults });

    } catch (error) {
        console.error("❌ Error fetching medication options:", error);
        res.status(500).json({ message: "Error fetching medication options", error: error.message });
    }
};