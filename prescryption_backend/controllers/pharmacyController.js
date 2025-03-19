const bcrypt = require('bcrypt');
const axios = require('axios');
const PharmacyUser = require('../models/PharmacyUser');
const Pharmacy = require('../models/Pharmacy');
const Doctor = require("../models/Doctor");
const { Web3 } = require('web3');
const blockchainService = require('../services/blockchainService');
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

        // 📌 Extraer los nombres de los medicamentos y **filtrar los que sean "N/A"**
        const medications = [prescription.meds.med1, prescription.meds.med2]
            .filter(med => med && med !== "N/A"); // ❌ Evita buscar "N/A"

        if (medications.length === 0) {
            return res.status(400).json({ message: "⚠️ No valid medication found in the prescription." });
        }

        console.log(`🔍 Fetching medication options for: ${medications}`);

        // 📌 Buscar en caché primero
        const cachedMedications = await MedicationCache.find({
            genericName: { $in: medications }
        });

        // 📌 Verificar si los datos en caché están actualizados
        const outdated = cachedMedications.some(med => {
            return (Date.now() - med.updatedAt) / (1000 * 60 * 60 * 24) > 7; // Más de 7 días
        });

        if (cachedMedications.length === medications.length && !outdated) {
            console.log("✅ Using cached data.");
            return res.json({ fromCache: true, results: cachedMedications });
        }

        console.log("⚠️ Cache is outdated or missing data, fetching new data...");

        // 📌 Realizar scraping solo de medicamentos válidos
        const scrapedResults = [];
        for (const drugName of medications) {
            const results = await medicationScraper.scrapeMedicationData(drugName);
            scrapedResults.push(...results);
        }

        if (scrapedResults.length === 0) {
            return res.status(404).json({ message: "⚠️ No medication options found." });
        }

        // 📌 Limitar resultados a 30 medicamentos
        const limitedResults = scrapedResults.slice(0, 30);

        // 📌 Guardar en caché los nuevos datos
        await MedicationCache.deleteMany({ genericName: { $in: medications } }); // Limpiar caché previa
        await MedicationCache.insertMany(limitedResults);

        res.json({ fromCache: false, results: limitedResults });

    } catch (error) {
        console.error("❌ Error fetching medication options:", error);
        res.status(500).json({ message: "Error fetching medication options", error: error.message });
    }
};


exports.validatePrescription = async (req, res) => {
    try {
        const { prescriptionId, selectedMedicationIds } = req.body;
        const { nid } = req.user;

        console.log(`🔄 Iniciando validación de receta...`);
        console.log(`📌 prescriptionId: ${prescriptionId}`);
        console.log(`📌 selectedMedicationIds: ${JSON.stringify(selectedMedicationIds)}`);
        console.log(`📌 nid del usuario: ${nid}`);

        if (!prescriptionId || !selectedMedicationIds || !Array.isArray(selectedMedicationIds)) {
            console.log("❌ Error: Prescription ID y medicamentos seleccionados son obligatorios.");
            return res.status(400).json({ message: "❌ Prescription ID and valid medication selection are required." });
        }

        // 📌 Buscar la farmacia asociada al usuario
        console.log(`🔍 Buscando usuario de farmacia con NID: ${nid}`);
        const pharmacyUser = await PharmacyUser.findOne({ nid });
        if (!pharmacyUser) {
            console.log("❌ No se encontró el usuario de la farmacia.");
            return res.status(404).json({ message: "❌ Pharmacy user not found." });
        }

        console.log(`🔍 Buscando farmacia con NID: ${pharmacyUser.pharmacyNid}`);
        const pharmacy = await Pharmacy.findOne({ nid: pharmacyUser.pharmacyNid });
        if (!pharmacy) {
            console.log("❌ No se encontró la farmacia.");
            return res.status(404).json({ message: "❌ Pharmacy not found." });
        }

        // 📌 Obtener la receta desde la blockchain
        console.log(`🔍 Buscando receta en blockchain con ID: ${prescriptionId}`);
        const prescription = await blockchainService.getPrescriptionById(prescriptionId);
        if (!prescription) {
            console.log("❌ La receta no fue encontrada en la blockchain.");
            return res.status(404).json({ message: "❌ Prescription not found in blockchain." });
        }

        console.log(`✅ Receta encontrada: ${JSON.stringify(prescription)}`);

        if (prescription.used) {
            console.log("⚠️ La receta ya fue utilizada.");
            return res.status(400).json({ message: "⚠️ Prescription is already used." });
        }

        const currentTime = Math.floor(Date.now() / 1000);
        if (currentTime > prescription.expirationDate) {
            console.log("⚠️ La receta está vencida.");
            return res.status(400).json({ message: "⚠️ Prescription has expired." });
        }

        // 📌 Obtener información de los medicamentos seleccionados
        console.log(`🔍 Buscando medicamentos con IDs: ${JSON.stringify(selectedMedicationIds)}`);
        const selectedMedications = await MedicationCache.find({ _id: { $in: selectedMedicationIds } });

        console.log(`✅ Medicamentos encontrados: ${JSON.stringify(selectedMedications)}`);

        if (selectedMedications.length !== selectedMedicationIds.length) {
            console.log("❌ No todos los medicamentos seleccionados fueron encontrados en la base de datos.");
            return res.status(404).json({ message: "❌ One or more selected medications not found." });
        }

        let finalPrices = [];

        for (const med of selectedMedications) {
            console.log(`🔍 Calculando precio final para el medicamento: ${med.genericName}`);
            console.log("📌 Enviando solicitud a /api/insurance/coverage con:");

            let finalPrice;
            let governmentCoverage = 0; // Cobertura según el gobierno
            let insuranceCoverage = 0; // Cobertura según la obra social

            // 🔍 Verificar si algún componente activo está en las listas del gobierno
            if (med.activeComponentsList) {
                console.log(`📌 Componentes activos del medicamento: ${JSON.stringify(med.activeComponentsList)}`);
                for (const component of med.activeComponentsList) {
                    const componentLower = component.trim().toLowerCase();

                    if (PMO_MEDICATIONS.has(componentLower)) {
                        governmentCoverage = 100; // Cobertura total por PMO
                        console.log(`✅ ${component} está en PMO_MEDICATIONS. Cobertura del 100%`);
                        break; // No necesitamos seguir verificando
                    }
                    
                    if (RESOLUCION_27_2022.has(componentLower)) {
                        governmentCoverage = Math.max(governmentCoverage, 70);
                        console.log(`✅ ${component} está en RESOLUCION_27_2022. Cobertura del 70%`);
                    }
                }
            }

            if (prescription.insurance.insuranceName === "PAMI" && med.pamiPrice) {
                console.log(`✅ Aplicando precio PAMI: ${med.pamiPrice}`);
                finalPrice = med.pamiPrice;
            } else {
                console.log(`🔍 Consultando cobertura de seguro para ${med.genericName}`);

                try {
                    const coverageResponse = await axios.post("http://localhost:5004/api/insurance/coverage", {
                        insurance_name: prescription.insurance.insuranceName,
                        plan: prescription.insurance.insurancePlan,
                        drug_name: med.genericName
                    });

                    console.log(`✅ Respuesta de cobertura: ${JSON.stringify(coverageResponse.data)}`);

                    insuranceCoverage = coverageResponse.data.coverage || 0;
                } catch (error) {
                    console.log("❌ Error al consultar cobertura:", 
                        error.response ? JSON.stringify(error.response.data) : error.message
                    );
                    return res.status(500).json({ message: "Error fetching insurance coverage.", details: error.response?.data || error.message });
                }
            }

            // 🔍 Comparar coberturas y elegir la mayor
            const finalCoverage = Math.max(governmentCoverage, insuranceCoverage);
            console.log(`📌 Cobertura final aplicada: ${finalCoverage}%`);

            finalPrice = med.price * (1 - finalCoverage / 100);

            finalPrices.push({ medication: med, finalPrice });
        }

        console.log(`✅ Prescripción validada con éxito.`);
        return res.status(200).json({ message: "✅ Prescription validated.", finalPrices });

    } catch (error) {
        console.error("❌ Error validating prescription:", error.message);
        return res.status(500).json({ message: "Error validating prescription." });
    }
};


exports.cancelPrescriptionValidation = async (req, res) => {
    try {
        const { prescriptionId } = req.body;
        if (!prescriptionId) {
            return res.status(400).json({ message: "❌ Prescription ID is required." });
        }

        console.log(`🔄 Cancelling validation for prescription ID: ${prescriptionId}...`);

        // 🔄 Llamar a `clearPendingValidation` en la blockchain
        const result = await blockchainService.clearPendingValidation(prescriptionId);

        res.status(200).json({
            message: "✅ Prescription validation cancelled. Prescription is now available again.",
            transaction: result
        });
    } catch (error) {
        console.error("❌ Error cancelling prescription validation:", error.message);
        res.status(500).json({ message: "Error cancelling prescription validation." });
    }
};


exports.processPurchase = async (req, res) => {
    console.log("📌 Body recibido:", req.body);


    try {
        const { prescriptionId, selectedMedications, totalAmount } = req.body;
        const { nid } = req.user;

        console.log(`🛒 Procesando compra para la receta ${prescriptionId}...`);

        if (!prescriptionId || !selectedMedications || selectedMedications.length === 0) {
            return res.status(400).json({ message: "❌ Prescription ID and medications are required." });
        }

        // 📌 Obtener la receta desde la blockchain
        console.log(`🔍 Buscando receta en blockchain con ID: ${prescriptionId}`);
        const prescription = await blockchainService.getPrescriptionById(prescriptionId);
        if (!prescription) {
            console.log("❌ La receta no fue encontrada en la blockchain.");
            return res.status(404).json({ message: "❌ Prescription not found in blockchain." });
        }

        console.log(`✅ Receta encontrada: ${JSON.stringify(prescription)}`);

        // 📌 Buscar el usuario farmacéutico en la base de datos
        console.log(`🔍 Buscando usuario de farmacia con NID: ${nid}`);
        const pharmacyUser = await PharmacyUser.findOne({ nid });

        if (!pharmacyUser) {
            console.log("❌ No se encontró el usuario de la farmacia.");
            return res.status(404).json({ message: "❌ Pharmacy user not found." });
        }

        // 📌 Ahora buscamos la farmacia con el pharmacyNid del usuario
        console.log(`🔍 Buscando información de la farmacia con NID: ${pharmacyUser.pharmacyNid}`);
        const pharmacy = await Pharmacy.findOne({ nid: pharmacyUser.pharmacyNid });

        if (!pharmacy) {
            console.log("❌ No se encontró la farmacia.");
            return res.status(404).json({ message: "❌ Pharmacy not found." });
        }

        console.log(`✅ Farmacia encontrada: ${pharmacy.pharmacy_name}`);

        // 📌 Buscar la información del médico en la base de datos
        console.log(`🔍 Buscando información del médico con NID: ${prescription.doctorNid}`);
        const doctor = await Doctor.findOne({ nid: prescription.doctorNid });
        if (!doctor) {
            console.log("❌ No se encontró el médico.");
            return res.status(404).json({ message: "❌ Doctor not found." });
        }

        console.log(`✅ Médico encontrado: ${doctor.name} ${doctor.surname}`);

        // 🔹 Generar un número de factura único (ejemplo: FACT-20240316-123456)
        const invoiceNumber = `FACT-${new Date().toISOString().replace(/[-T:.Z]/g, "").slice(0, 12)}-${Math.floor(Math.random() * 100000)}`;

        // 🔹 Marcar la receta como usada en la blockchain
        const blockchainResponse = await blockchainService.markPrescriptionAsUsed(prescriptionId, invoiceNumber, pharmacy.nid);
        if (!blockchainResponse.success) {
            return res.status(500).json({ message: "❌ Failed to mark prescription as used." });
        }

        // 🔹 Generar factura simulada llamando a la API de facturación
        const invoiceData = {
            invoiceNumber,
            prescriptionId,
            pharmacy: {
                name: pharmacy.pharmacy_name,
                cuit: pharmacy.nid,
                address: pharmacy.physicalAddress,
                contact: pharmacy.contactInfo
            },
            patient: {
                dni: prescription.patientNid,
                name: prescription.patientName,
                address: prescription.patientAddress
            },
            doctor: {
                name: doctor.name,
                surname: doctor.surname,
                specialty: doctor.specialty,
                license: doctor.license
            },
            medications: selectedMedications,
            totalAmount
        };

        const invoiceResponse = await axios.post("http://localhost:5005/api/invoice/generate", invoiceData);
        console.log("✅ Factura generada:", invoiceResponse.data);

        return res.status(200).json({ message: "✅ Purchase completed.", invoice: invoiceResponse.data });

    } catch (error) {
        console.error("❌ Error processing purchase:", error);
        return res.status(500).json({ message: "Error processing purchase." });
    }
};