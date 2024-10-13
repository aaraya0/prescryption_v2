const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const prescriptionRoutes = require('./prescriptionRoutes');
const Doctor = require('./models/Doctor');
const Pharmacy = require('./models/Pharmacy');
const Patient = require('./models/Patient');
const Insurance = require('./models/Insurance');
const { Web3 } = require('web3');  // Cambiado aquí

require('dotenv').config();
const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:7545"));
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

// User registry

// Patient registry
app.post('/register_patient', async (req, res) => {
    const { name, surname, nid, birth_date, sex, insurance_name, insurance_plan, affiliate_num, mail, password } = req.body;

    // Verifica si el paciente ya está registrado
    const existingPatient = await Patient.findOne({ nid });
    if (existingPatient) {
        return res.status(400).send('Patient already registered with this NID.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generar address de Ethereum para el paciente
    const account = web3.eth.accounts.create();
    const newPatient = new Patient({
        name,
        surname,
        nid,
        birth_date,
        sex,
        insurance_name,
        insurance_plan,
        affiliate_num,
        mail,
        password: hashedPassword,
        address: account.address  // Guardar la address generada
    });

    try {
        await newPatient.save();
        res.send('Patient registered.');
    } catch (err) {
        res.status(400).send(err);
    }
});


// Doctor registry
// Doctor registry
app.post('/register_doctor', async (req, res) => {
    try {
        console.log('Request body:', req.body);
        const { nid, license, name, surname, specialty, password, mail } = req.body;

        // Verificación de campos obligatorios
        if (!nid || !license || !name || !surname || !specialty || !password || !mail) {
            console.log('Missing required fields');
            return res.status(400).send('Missing required fields');
        }

        // Licence verification
        try {
            console.log('Starting license verification...');
            const verifyResponse = await axios.post('http://localhost:5000/verify', { nid, license });
            console.log('License verification response:', verifyResponse.data);
            if (!verifyResponse.data.valid) {
                return res.status(400).send('Invalid license or NID');
            }
        } catch (err) {
            console.error('Error in license verification:', err.message);
            return res.status(500).send('Error verifying license');
        }

        // Hashing the password
        let hashedPassword;
        try {
            console.log('Hashing password...');
            hashedPassword = await bcrypt.hash(password, 10);
        } catch (err) {
            console.error('Error hashing password:', err.message);
            return res.status(500).send('Error hashing password');
        }

        // Saving doctor to the database
        const newDoctor = new Doctor({ nid, license, name, surname, specialty, password: hashedPassword, mail });
        try {
            console.log('Saving new doctor to the database...');
            await newDoctor.save();
            console.log('Doctor registered successfully');
            res.send('Doctor registered');
        } catch (err) {
            console.error('Error saving doctor to the database:', err.message);
            return res.status(400).send('Error en el registro');
        }
    } catch (err) {
        console.error('Unexpected error:', err.message);
        return res.status(500).send('Internal server error');
    }
});


// Pharmacy registry
app.post('/register_pharmacy', async (req, res) => {
    const { nid, license, name, surname, pharmacy_name, pharmacy_nid, mail, password, alias} = req.body;

    // License verification
    try {
        const verifyResponse = await axios.post('http://localhost:5000/verify', { license, nid });
        if (!verifyResponse.data.valid) {
            return res.status(400).send('Invalid license or NID.');
        }
    } catch (err) {
        return res.status(500).send('Error verifying license.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newPharmacy = new Pharmacy({ nid, license, name, surname, pharmacy_name, pharmacy_nid, mail, password: hashedPassword, alias });
    try {
        await newPharmacy.save();
        res.send('Pharmacy registered.');
    } catch (err) {
        res.status(400).send(err);
    }
});

// Insurance registry
app.post('/register_insurance', async (req, res) => {
    const { name, surname, nid, insurance_name, insurance_nid, mail, password } = req.body;

    // Verifies existing user with that NID
    const existingInsurance = await Insurance.findOne({ nid });
    if (existingInsurance) {
        return res.status(400).send('Insurance with same NID already registered.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newInsurance = new Insurance({ name, surname, nid, insurance_name, insurance_nid, mail, password: hashedPassword });
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
            user = await Pharmacy.findOne({ nid });
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