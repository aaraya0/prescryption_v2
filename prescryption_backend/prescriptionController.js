const fs = require('fs');
const path = require('path');
const { Web3 } = require('web3');  // Changed here
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const Doctor = require('./models/Doctor');
const Patient = require('./models/Patient');
const Pharmacy = require('./models/Pharmacy');
const axios = require('axios');

// Web3 configuration
const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:7545"));

// Read contract addresses from JSON file
const contractsDataPath = path.resolve(__dirname, '../prescryption_solidity/contracts_data.json');
const contractsData = JSON.parse(fs.readFileSync(contractsDataPath, 'utf8'));

// Load contract ABI
const prescriptionContractPath = path.resolve(__dirname, '../prescryption_solidity/build/contracts', 'PrescriptionContract.json');
const prescriptionContractJSON = JSON.parse(fs.readFileSync(prescriptionContractPath, 'utf8'));

// Instantiate the prescription contract
const prescriptionContract = new web3.eth.Contract(prescriptionContractJSON.abi, contractsData.PrescriptionContract);

exports.issuePrescription = async (req, res) => {
    const {
        patientName,
        patientNid,
        affiliateNum,
        insuranceName,
        insurancePlan,
        med1,
        quantity1,
        med2,
        quantity2,
        diagnosis,
        observations
    } = req.body;

    const { nid } = req.user; // Authenticated doctor's NID

    try {
        // Validations
        if (!patientName || !patientNid || !affiliateNum || !insuranceName || !insurancePlan || !med1 || !quantity1 || !diagnosis) {
            return res.status(400).send('Missing necessary data.');
        }

        // Search for the doctor in the database
        const doctor = await Doctor.findOne({ nid });
        if (!doctor) {
            return res.status(404).send('Doctor not found.');
        }

        // Search for the patient by NID in the database
        const patient = await Patient.findOne({ nid: patientNid });
        if (!patient) {
            return res.status(404).send('Patient not found.');
        }

        const accounts = await web3.eth.getAccounts();
        const fromAccount = accounts[0];

        // Use the current date for issuance
        const issueDate = new Date();

        // Convert the date to timestamp (in seconds)
        const issueDateTimestamp = Math.floor(issueDate.getTime() / 1000);

        // Calculate expiration date (30 days after the current date)
        const expirationDate = new Date(issueDate);
        expirationDate.setDate(issueDate.getDate() + 30);

        // Prepare meds structure
        const meds = {
            med1,
            quantity1,
            med2: med2 || "N/A", // Send "N/A" if med2 is empty
            quantity2: quantity2 || 0, // Send 0 if quantity2 is empty
            diagnosis,
            observations: observations || " "
        };

        const insurance = {
            affiliateNum,
            insuranceName,
            insurancePlan
        };

        // Call the contract to issue the prescription
        const receipt = await prescriptionContract.methods
            .issuePrescription(
                patientName,
                patientNid,
                meds,
                insurance,
                doctor.nid,
                patient.address,
                issueDateTimestamp
            )
            .send({ from: fromAccount, gas: '2000000' });
    
        if (receipt.status) {
            const prescriptionId = receipt.events.IssuedPrescription.returnValues.id;
    
            // Convert receipt and its fields to string
            const formattedReceipt = convertBigIntToString({
                message: 'Prescription issued and saved in blockchain',
                prescriptionId,
                transactionHash: receipt.transactionHash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed
            });
    
            res.send(formattedReceipt);
        } else {
            res.status(500).send('Error issuing prescription in blockchain');
        }
    } catch (error) {
        console.error('Error issuing prescription:', error);
        res.status(500).send('Error issuing prescription. Details: ' + error.message);
    }
};


exports.getPresbyDoctorNid = async (req, res) => {
    try {
        const { nid } = req.user; // Doctor's NID from JWT token
    
        // Find the doctor in the database
        const doctor = await Doctor.findOne({ nid });
        if (!doctor) {
            console.error(`Doctor with NID: ${nid} not found in the database.`);
            return res.status(404).send('Doctor not found.');
        }
    
        // Get Ganache accounts
        const accounts = await web3.eth.getAccounts();
        const fromAccount = accounts[0]; // First Ganache account
    
        // Call the smart contract function to get prescriptions by doctor's NID
        const prescriptions = await prescriptionContract.methods.getPresbyDoctorNid(doctor.nid).call({ from: fromAccount });
    
        // Check if prescriptions were found
        if (prescriptions.length === 0) {
            console.warn(`No prescriptions found for doctor NID: ${doctor.nid}`);
            return res.status(404).send('Prescriptions not found for this doctor.');
        }
    
        // Process prescriptions, ensuring to handle BigInt
        const formattedPrescriptions = prescriptions.map(prescription => {
            const issueDate = new Date(Number(prescription.issueDate) * 1000);
            const expirationDate = new Date(Number(prescription.expirationDate) * 1000);
            const isExpired = new Date() > expirationDate;
    
            return {
                prescriptionId: convertBigIntToString(prescription.id),
                patientName: prescription.patientName,
                patientNid: prescription.patientNid,
                meds: {
                    med1: prescription.meds.med1,
                    quantity1: Number(prescription.meds.quantity1),
                    med2: prescription.meds.med2,
                    quantity2: Number(prescription.meds.quantity2),
                    diagnosis: prescription.meds.diagnosis,
                    observations: prescription.meds.observations

                },
                
                insurance: {
                    affiliateNum: prescription.insurance.affiliateNum,
                    insuranceName: prescription.insurance.insuranceName,
                    insurancePlan: prescription.insurance.insurancePlan
                },
                doctorNid: prescription.doctorNid,
                issueDate: issueDate.toLocaleDateString(),
                expirationDate: expirationDate.toLocaleDateString(),
                patientAddress: prescription.patientAddress,
                status: isExpired ? 'Expired' : 'Valid'
            };
        });
    
        // Convert all prescription objects to strings
        const responseToSend = convertBigIntToString({
            message: 'Prescriptions obtained successfully',
            prescriptions: formattedPrescriptions
        });
    
        res.json(responseToSend);
    } catch (error) {
        console.error('Error obtaining prescriptions:', error);
        res.status(500).send('Error obtaining prescriptions. Details: ' + error.message);
    }
};
    

// Function to convert all BigInts to strings in an object
const convertBigIntToString = (obj) => {
    if (typeof obj === 'bigint') {
        return obj.toString();
    }
    if (Array.isArray(obj)) {
        return obj.map(convertBigIntToString);
    }
    if (typeof obj === 'object' && obj !== null) {
        return Object.fromEntries(
            Object.entries(obj).map(([key, value]) => [key, convertBigIntToString(value)])
        );
    }
    return obj;
};

exports.getAllPrescriptions = async (req, res) => {
    try {
        // Get Ganache accounts
        const accounts = await web3.eth.getAccounts();
        const fromAccount = accounts[0];

        console.log(`Calling contract to get all prescriptions from account: ${fromAccount}`);

        // Call the smart contract function to get all prescriptions
        const prescriptions = await prescriptionContract.methods.getPrescriptions().call({ from: fromAccount });

        // Check if prescriptions were found
        if (prescriptions.length === 0) {
            console.warn('No prescriptions found in the blockchain.');
            return res.status(404).send('No prescriptions found.');
        }

        // Convert all BigInts to strings in prescriptions
        const formattedPrescriptions = convertBigIntToString(prescriptions);

        console.log('All prescriptions obtained:', formattedPrescriptions);

        res.json({
            message: 'All prescriptions obtained successfully',
            prescriptions: formattedPrescriptions
        });
    } catch (error) {
        console.error('Error obtaining prescriptions:', error);
        res.status(500).send('Error obtaining prescriptions. Details: ' + error.message);
    }
};

exports.getPresbyPatientAddress = async (req, res) => {
    try {
        const { nid } = req.user; // Patient's NID from JWT token

        console.log(`Starting search for patient with NID: ${nid}`);

        // Find patient in the database
        const patient = await Patient.findOne({ nid });
        if (!patient) {
            console.error(`Patient with NID: ${nid} not found in the database.`);
            return res.status(404).send('Patient not found.');
        }

        const patientAddress = patient.address;
        console.log(`Patient address found: ${patientAddress}`);

        // Get Ganache accounts
        const accounts = await web3.eth.getAccounts();
        const fromAccount = accounts[0];
        console.log(`Ganache account used for transaction: ${fromAccount}`);

        // Call the smart contract function to get prescriptions by patient address
        console.log(`Searching blockchain for prescriptions for patient address: ${patientAddress}`);
        const prescriptions = await prescriptionContract.methods.getPresbyPatientAddress(patientAddress).call({ from: fromAccount });

        if (prescriptions.length === 0) {
            console.warn(`No prescriptions found for patient address: ${patientAddress}`);
            return res.status(404).send('Prescriptions not found for this patient.');
        }

        console.log(`Prescriptions obtained for patient: ${prescriptions.length} prescription(s) found`);

        const options = { day: '2-digit', month: '2-digit', year: 'numeric' };

        const formattedPrescriptions = await Promise.all(prescriptions.map(async (prescription) => {
            const issueDate = new Date(Number(prescription.issueDate) * 1000);
            const expirationDate = new Date(Number(prescription.expirationDate) * 1000);
            const isExpired = new Date() > expirationDate;

            console.log(`Processing prescription ID: ${prescription.id}. Issue Date: ${issueDate}, Expiration Date: ${expirationDate}`);

            console.log(`Searching for Doctor with NID: ${prescription.doctorNid}`);
            const doctor = await Doctor.findOne({ nid: prescription.doctorNid });

            if (!doctor) {
                console.warn(`Doctor with NID: ${prescription.doctorNid} not found.`);
                return {
                    prescriptionId: convertBigIntToString(prescription.id),
                    doctorName: 'Doctor not found',
                    doctorNid: prescription.doctorNid,
                    meds: {
                        med1: prescription.meds.med1,
                        quantity1: Number(prescription.meds.quantity1),
                        med2: prescription.meds.med2,
                        quantity2: Number(prescription.meds.quantity2),
                        diagnosis: prescription.meds.diagnosis,
                        observations: prescription.meds.observations,
                    },
                    insurance: {
                        affiliateNum: prescription.insurance.affiliateNum,
                        insuranceName: prescription.insurance.insuranceName,
                        insurancePlan: prescription.insurance.insurancePlan
                    },
                    patientNid: prescription.patientNid,
                    issueDate: issueDate.toLocaleDateString('en-GB', options),
                    expirationDate: expirationDate.toLocaleDateString('en-GB', options),
                    doctorAddress: prescription.doctorAddress,
                    status: prescription.used ? 'Dispensed' : isExpired ? 'Expired' : 'Valid'
                };
            }

            console.log(`Doctor found: ${doctor.name} ${doctor.surname}, Specialty: ${doctor.specialty}`);

            return {
                prescriptionId: convertBigIntToString(prescription.id),
                doctorName: `${doctor.name} ${doctor.surname}`,
                doctorSpecialty: doctor.specialty,
                meds: {
                    med1: prescription.meds.med1,
                    quantity1: Number(prescription.meds.quantity1),
                    med2: prescription.meds.med2,
                    quantity2: Number(prescription.meds.quantity2),
                    diagnosis: prescription.meds.diagnosis,
                    observations: prescription.meds.observations,
                },
                insurance: {
                    affiliateNum: prescription.insurance.affiliateNum,
                    insuranceName: prescription.insurance.insuranceName,
                    insurancePlan: prescription.insurance.insurancePlan
                },
                patientNid: prescription.patientNid,
                issueDate: issueDate.toLocaleDateString('en-GB', options),
                expirationDate: expirationDate.toLocaleDateString('en-GB', options),
                doctorAddress: prescription.doctorAddress,
                status: prescription.used ? 'Dispensed' : isExpired ? 'Expired' : 'Valid'
            };
        }));

        console.log(`Formatted prescriptions for patient: ${formattedPrescriptions.length} prescription(s) formatted`);

        const responseToSend = convertBigIntToString({
            message: 'Prescriptions obtained successfully',
            prescriptions: formattedPrescriptions
        });

        console.log('Sending response to frontend');
        res.json(responseToSend);
    } catch (error) {
        console.error('Error obtaining prescriptions:', error);
        res.status(500).send('Error obtaining prescriptions. Details: ' + error.message);
    }
};


exports.sendPrescriptionToPharmacy = async (req, res) => {
    const { alias, prescriptionId } = req.body;
    const patientNid = req.user.nid;

    try {
        const accounts = await web3.eth.getAccounts();
        const fromAccount = accounts[0];
        console.log("Using fromAccount:", fromAccount);

        // Find pharmacy by alias
        const pharmacy = await Pharmacy.findOne({ alias });
        if (!pharmacy) {
            return res.status(404).json({ message: 'Pharmacy not found' });
        }
        console.log("Pharmacy address:", pharmacy.address);

        // Find patient address using NID
        const patient = await Patient.findOne({ nid: patientNid });
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }
        const patientAddress = patient.address;
        console.log("Patient address:", patientAddress);

        // Get prescription data from blockchain
        let prescriptionData = await prescriptionContract.methods
            .getPrescription(prescriptionId)
            .call();

        if (!prescriptionData) {
            return res.status(404).json({ message: 'Prescription not found in blockchain' });
        }
        console.log("Original prescription data from blockchain:", prescriptionData);

        // Convert BigInt values in prescriptionData to avoid serialization issues
        prescriptionData = convertBigIntToString(prescriptionData);
        console.log("Converted prescription data (BigInt to String):", prescriptionData);

        // Prepare the updated prescription object
        const updatedPrescription = {
            id: prescriptionData.id,
            patientName: prescriptionData.patientName,
            patientNid: prescriptionData.patientNid,
            meds: prescriptionData.meds,
            insurance: prescriptionData.insurance,
            doctorNid: prescriptionData.doctorNid,
            patientAddress: patientAddress,
            pharmacyAddress: pharmacy.address,
            issueDate: prescriptionData.issueDate,
            expirationDate: prescriptionData.expirationDate
        };

        console.log("Updated prescription (before sending to blockchain):", updatedPrescription);

        // Send the updated prescription to the blockchain
        const receipt = await prescriptionContract.methods
            .updatePrescription(prescriptionId, updatedPrescription.pharmacyAddress) // Pass only pharmacyAddress as per contract function
            .send({ from: fromAccount, gas: '2000000' });

        if (receipt.status) {
            const formattedReceipt = convertBigIntToString({
                message: 'Prescription sent to pharmacy',
                transactionHash: receipt.transactionHash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed
            });
            console.log("Formatted receipt:", formattedReceipt);
            res.json(formattedReceipt);
        } else {
            res.status(500).json({ message: 'Error sending prescription' });
        }
    } catch (error) {
        console.error("Error sending prescription:", error);
        res.status(500).json({ message: 'Error sending prescription', error: error.message });
    }
};


exports.getPresbyPharmacyAddress = async (req, res) => {
    try {
        const { nid } = req.user; // Farmacia identificada por NID en JWT

        // Buscar la farmacia en la base de datos usando el NID
        const pharmacy = await Pharmacy.findOne({ nid });
        if (!pharmacy) {
            return res.status(404).send('Pharmacy not found.');
        }
        const pharmacyAddress = pharmacy.address;

        // Obtener cuentas de Ethereum
        const accounts = await web3.eth.getAccounts();
        const fromAccount = accounts[0];

        // Llamar al contrato para obtener las recetas por dirección de la farmacia
        const prescriptions = await prescriptionContract.methods
            .getPresbyPharmacyAddress(pharmacyAddress)
            .call({ from: fromAccount });

        // Validar si se encontraron recetas
        if (prescriptions.length === 0) {
            return res.status(404).send('No prescriptions found for this pharmacy.');
        }

        // Formatear las recetas obtenidas
        const formattedPrescriptions = await Promise.all(prescriptions.map(async (prescription) => {
            // Obtener datos del paciente de la receta
            const patient = await Patient.findOne({ address: prescription.patientAddress });
            const doctor = await Doctor.findOne({ nid: prescription.doctorNid });

            return {
                prescriptionId: convertBigIntToString(prescription.id),
                patient: {
                    name: patient.name,
                    surname: patient.surname,
                    nid: patient.nid,
                    address: prescription.patientAddress
                },
                meds: {
                    med1: prescription.meds.med1,
                    quantity1: Number(prescription.meds.quantity1),
                    med2: prescription.meds.med2,
                    quantity2: Number(prescription.meds.quantity2),
                    diagnosis: prescription.meds.diagnosis,
                    observations: prescription.meds.observations,
                },
                
                insurance: {
                    affiliateNum: prescription.insurance.affiliateNum,
                    insuranceName: prescription.insurance.insuranceName,
                    insurancePlan: prescription.insurance.insurancePlan
                },
                doctor: {
                    name: doctor ? doctor.name : 'Unknown',
                    surname: doctor ? doctor.surname : 'Unknown',
                    specialty: doctor ? doctor.specialty : 'Unknown',
                    nid: prescription.doctorNid,
                    address: prescription.doctorAddress
                },
                issueDate: new Date(Number(prescription.issueDate) * 1000).toLocaleDateString('en-GB'),
                expirationDate: new Date(Number(prescription.expirationDate) * 1000).toLocaleDateString('en-GB'),
                used: prescription.used,
                invoiceNumber: prescription.used ? prescription.invoiceNumber : "" // Incluir el número de factura solo si está usada
            };
        }));

        // Enviar las recetas formateadas al cliente
        res.json({
            message: 'Prescriptions obtained successfully',
            prescriptions: formattedPrescriptions
        });
    } catch (error) {
        console.error('Error obtaining prescriptions for pharmacy:', error);
        res.status(500).send('Error obtaining prescriptions. Details: ' + error.message);
    }
};



// Endpoint to validate a prescription with two medications
exports.validatePrescription = async (req, res) => {
    const { prescriptionId, brand1, brand2 } = req.body;
    const { nid } = req.user;

    try {
        // Validate pharmacy
        const pharmacy = await Pharmacy.findOne({ nid });
        if (!pharmacy) {
            return res.status(404).json({ message: 'Pharmacy not found' });
        }

        // Fetch prescription data from blockchain
        const prescription = await prescriptionContract.methods.getPrescription(prescriptionId).call();
        if (!prescription) {
            return res.status(404).json({ message: 'Prescription not found in blockchain' });
        }

        // Validate each medication individually, taking quantity into account
        const meds = [
            { name: prescription.meds.med1, quantity: Number(prescription.meds.quantity1), brand: brand1 || 'Genérico' },
            { name: prescription.meds.med2, quantity: Number(prescription.meds.quantity2), brand: brand2 || 'Genérico' }
        ];

        const validations = await Promise.all(meds.map(async (med) => {
            if (!med.name) return null; // Skip validation if medication is not specified
        
            try {
                // Fetch price from vademecum API
                const priceResponse = await axios.get('http://localhost:4001/api/vademecum/price', {
                    params: { drug_name: med.name, brand: med.brand }
                });
                const pricePerUnit = priceResponse.data.price;
                const totalOriginalPrice = pricePerUnit * med.quantity; // Multiplica por la cantidad aquí
        
                // Fetch coverage from insurance API
                const coverageResponse = await axios.get('http://localhost:4001/api/insurance/coverage', {
                    params: {
                        insurance_name: prescription.insurance.insuranceName,
                        plan: prescription.insurance.insurancePlan,
                        drug_name: med.name
                    }
                });
                const coveragePercentage = coverageResponse.data.coverage;
                const coveredAmount = (totalOriginalPrice * coveragePercentage) / 100;
                const finalPrice = totalOriginalPrice - coveredAmount;
        
                return {
                    drugName: med.name,
                    brand: med.brand,
                    quantity: med.quantity,
                    originalPrice: totalOriginalPrice,
                    coveragePercentage,
                    coveredAmount,
                    finalPrice
                };
            } catch (error) {
                console.warn(`Validation failed for ${med.name}: ${error.message}`);
                return {
                    drugName: med.name,
                    brand: med.brand,
                    quantity: med.quantity,
                    originalPrice: 0,
                    coveragePercentage: 0,
                    coveredAmount: 0,
                    finalPrice: 0
                };
            }
        }));
        

        const validatedMeds = validations.filter(result => result !== null);

        return res.json({
            message: 'Prescription validated successfully',
            validatedMeds
        });
    } catch (error) {
        console.error('Error validating prescription:', error);
        res.status(500).json({ message: 'Error validating prescription', error: error.message });
    }
};


exports.generateInvoiceAndMarkUsed = async (req, res) => {
    const { prescriptionId, patientName, validatedMeds } = req.body;

    try {
        const totalPrice = validatedMeds.reduce((sum, med) => sum + med.originalPrice, 0);
        const totalCoverage = validatedMeds.reduce((sum, med) => sum + med.coveredAmount, 0);
        const finalPrice = totalPrice - totalCoverage;

        // Llamada a la API de facturación
        const invoiceResponse = await axios.post('http://localhost:4002/api/generate_invoice', {
            prescription_id: prescriptionId,
            patient_name: patientName,
            total_price: totalPrice,
            coverage_percentage: (totalCoverage / totalPrice) * 100,
            final_price: finalPrice
        });

        const invoiceData = invoiceResponse.data;
        console.log('Datos de la factura generada:', invoiceData);

        const accounts = await web3.eth.getAccounts();
        const fromAccount = accounts[0];

        // Llama a la función de blockchain para marcar la receta como usada y agregar el número de factura
        const receipt = await prescriptionContract.methods
            .markPrescriptionAsUsed(prescriptionId, invoiceData.invoice_number) // Pasa el número de factura
            .send({ from: fromAccount, gas: '200000' });

        if (!receipt.status) {
            return res.status(500).json({ message: 'Failed to mark prescription as used on blockchain.' });
        }

        res.json({
            message: 'Invoice generated and prescription marked as used',
            invoice: invoiceData
        });
    } catch (error) {
        console.error('Error generating invoice and marking prescription as used:', error);
        res.status(500).json({ message: 'Error generating invoice or updating prescription', error: error.message });
    }
};




// Endpoint to get user profile information
exports.getUserProfile = async (req, res) => {
    const { userType } = req.user; // Extract user type from token
    const { nid } = req.user; // User's unique identifier (NID)

    try {
        let userProfile;

        switch (userType) {
            case 'patient':
                userProfile = await Patient.findOne({ nid });
                if (!userProfile) return res.status(404).json({ message: 'Patient not found.' });
                break;

            case 'doctor':
                userProfile = await Doctor.findOne({ nid });
                if (!userProfile) return res.status(404).json({ message: 'Doctor not found.' });
                break;

            case 'pharmacy':
                userProfile = await Pharmacy.findOne({ nid });
                if (!userProfile) return res.status(404).json({ message: 'Pharmacy not found.' });
                break;

            case 'insurance':
                userProfile = await Insurance.findOne({ nid });
                if (!userProfile) return res.status(404).json({ message: 'Insurance provider not found.' });
                break;

            default:
                return res.status(400).json({ message: 'Invalid user type.' });
        }

        // Send back the user's profile data
        res.json({ userType, profile: userProfile });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Error fetching profile data', error: error.message });
    }
};

// Endpoint para obtener el perfil de un paciente por DNI
exports.getPatientByNID = async (req, res) => {
    const { nid } = req.params; // DNI del paciente pasado como parámetro

    try {
        const userProfile = await Patient.findOne({ nid });
        if (!userProfile) {
            return res.status(404).json({ message: 'Patient not found.' });
        }

        // Enviamos los datos del perfil del paciente
        res.json({ profile: userProfile });
    } catch (error) {
        console.error('Error fetching patient profile:', error);
        res.status(500).json({ message: 'Error fetching profile data', error: error.message });
    }
};
