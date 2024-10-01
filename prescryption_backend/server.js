const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const Wallet = require('ethereumjs-wallet').default; // Importación para generar direcciones blockchain
const prescriptionRoutes = require('./prescriptionRoutes');
const Doctor = require('./models/Doctor');
const Pharmacist = require('./models/Pharmacist');
const Patient = require('./models/Patient');
const Insurance = require('./models/Insurance');

require('dotenv').config();

const app = express();

// CORS configuration
app.use(cors({
    origin: 'http://localhost:3000', // frontend url
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

app.use(bodyParser.json());

// Middleware to verify token
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(403).send('Token required');

    const token = authHeader.split(' ')[1]; // deletes "Bearer" prefix
    if (!token) return res.status(403).send('Token required');

    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).send('Invalid token');
    }
};

// use routes 
app.use('/api', verifyToken, prescriptionRoutes);

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error(err));

const SECRET_KEY = process.env.SECRET_KEY;

// Helper function to generate blockchain address
function generarDireccionBlockchain() {
    const wallet = Wallet.generate();
    const privateKey = wallet.getPrivateKeyString();
    const address = wallet.getAddressString();
    
    return {
        privateKey,
        address
    };
}

// User registry

// Patient registry
app.post('/patient_register', async (req, res) => {
    const { name, surname, nid, birth_date, insurance_name, insurance_plan, affiliate_num, mail, password } = req.body;

    // Checks for existing patients with that nid
    const existingPatient = await Patient.findOne({ nid });
    if (existingPatient) {
        return res.status(400).send('Patient already registered with this NID.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Genera dirección blockchain
    const { privateKey, address } = generarDireccionBlockchain();
    const encryptedPrivateKey = await bcrypt.hash(privateKey, 10); // Encripta la clave privada

    const newPatient = new Patient({
        name,
        surname,
        nid,
        birth_date,
        insurance_name,
        insurance_plan,
        affiliate_num,
        mail,
        password: hashedPassword,
        blockchain: {
            privateKey: encryptedPrivateKey, // Se almacena encriptada
            address
        }
    });

    try {
        await newPatient.save();
        res.send('Patient registered.');
    } catch (err) {
        res.status(400).send(err);
    }
});

// Doctor registry
app.post('/doctor_register', async (req, res) => {
    const { nid, license, name, surname, specialty, password, mail } = req.body;

    // Licence verification
    try {
        const verifyResponse = await axios.post('http://localhost:5000/verify', { nid, license });
        if (!verifyResponse.data.valid) {
            return res.status(400).send('Invalid license or NID');
        }
    } catch (err) {
        return res.status(500).send('Error verifying license');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Genera dirección blockchain
    const { privateKey, address } = generarDireccionBlockchain();
    const encryptedPrivateKey = await bcrypt.hash(privateKey, 10); // Encripta la clave privada

    const newDoctor = new Doctor({
        nid,
        license,
        name,
        surname,
        specialty,
        password: hashedPassword,
        mail,
        blockchain: {
            privateKey: encryptedPrivateKey, // Se almacena encriptada
            address
        }
    });

    try {
        await newDoctor.save();
        res.send('Doctor registered');
    } catch (err) {
        res.status(400).send(err);
    }
});

// Pharmacist registry
app.post('/pharmacist_register', async (req, res) => {
    const { nid, license, name, surname, pharmacy, pharmacy_nid, mail, password } = req.body;

    // License verification
    try {
        const verifyResponse = await axios.post('http://localhost:5000/verify', { license });
        if (!verifyResponse.data.valid) {
            return res.status(400).send('Invalid license or NID.');
        }
    } catch (err) {
        return res.status(500).send('Error verifying license.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Genera dirección blockchain
    const { privateKey, address } = generarDireccionBlockchain();
    const encryptedPrivateKey = await bcrypt.hash(privateKey, 10); // Encripta la clave privada

    const newPharmacist = new Pharmacist({
        nid,
        license,
        name,
        surname,
        pharmacy,
        pharmacy_nid,
        mail,
        password: hashedPassword,
        blockchain: {
            privateKey: encryptedPrivateKey, // Se almacena encriptada
            address
        }
    });

    try {
        await newPharmacist.save();
        res.send('Pharmacist registered.');
    } catch (err) {
        res.status(400).send(err);
    }
});

// Insurance registry
app.post('/insurance_register', async (req, res) => {
    const { name, surname, nid, insurance_name, insurance_nid, mail, password } = req.body;

    // Verifies existing user with that NID
    const existingInsurance = await Insurance.findOne({ nid });
    if (existingInsurance) {
        return res.status(400).send('Insurance with same NID already registered.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Genera dirección blockchain
    const { privateKey, address } = generarDireccionBlockchain();
    const encryptedPrivateKey = await bcrypt.hash(privateKey, 10); // Encripta la clave privada

    const newInsurance = new Insurance({
        name,
        surname,
        nid,
        insurance_name,
        insurance_nid,
        mail,
        password: hashedPassword,
        blockchain: {
            privateKey: encryptedPrivateKey, // Se almacena encriptada
            address
        }
    });

    try {
        await newInsurance.save();
        res.send('Insurance registered.');
    } catch (err) {
        res.status(400).send(err);
    }
});

// Login
app.post('/login', async (req, res) => {
    const { nid, password, userType } = req.body;
    let user;
    switch (userType) {
        case 'doctor':
            user = await Doctor.findOne({ nid });
            break;
        case 'pharmacy':
            user = await Pharmacist.findOne({ nid });
            break;
        case 'patient':
            user = await Patient.findOne({ nid });
            break;
        case 'insurance':
            user = await Insurance.findOne({ nid });
            break;
        default:
            return res.status(400).send('Invalid user type');
    }

    if (user && await bcrypt.compare(password, user.password)) {
        const token = jwt.sign({ nid, userType }, SECRET_KEY);
        res.json({ token });
    } else {
        res.status(401).send('Invalid credentials');
    }
});

app.listen(3001, () => console.log('Server running on port 3001'));
