const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
// Rutas de receta
const recetaRoutes = require('./prescriptionRoutes');
// Importar los modelos desde la carpeta models
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

// Middleware para verificar el token
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(403).send('Token requerido');

    const token = authHeader.split(' ')[1]; // Aquí se elimina el prefijo "Bearer"
    if (!token) return res.status(403).send('Token requerido');

    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).send('Token inválido');
    }
};

// Usar las rutas de recetas con verificación de token
app.use('/api', verifyToken, recetaRoutes);

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error(err));



const SECRET_KEY = process.env.SECRET_KEY;

// Registro de usuarios

// Registro de pacientes
app.post('/register_paciente', async (req, res) => {
    const { name, surname, nid, fecha_nacimiento, obra_social, plan_os, num_afiliado, mail, password } = req.body;

    // Verifica si ya existe un paciente con el mismo DNI
    const existingPatient = await Patient.findOne({ nid });
    if (existingPatient) {
        return res.status(400).send('Un paciente con este DNI ya está registrado.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newPatient = new Patient({ name, surname, nid, fecha_nacimiento, obra_social, plan_os, num_afiliado, mail, password: hashedPassword });
    try {
        await newPatient.save();
        res.send('Paciente registrado.');
    } catch (err) {
        res.status(400).send(err);
    }
});

// Registro de médicos (con verificación de matrícula)
app.post('/register_medico', async (req, res) => {
    const { nid, license, name, surname, specialty, password, mail } = req.body;

    // Verificación de matrícula
    try {
        const verifyResponse = await axios.post('http://localhost:5000/verify', { nid, license });
        if (!verifyResponse.data.valid) {
            return res.status(400).send('Matrícula o DNI no válido.');
        }
    } catch (err) {
        return res.status(500).send('Error verificando matrícula.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newDoctor = new Doctor({ nid, license, name, surname, specialty, password: hashedPassword, mail });
    try {
        await newDoctor.save();
        res.send('Médico registrado.');
    } catch (err) {
        res.status(400).send(err);
    }
});

// Registro de farmacéuticos (con verificación de matrícula)
app.post('/register_farmaceutico', async (req, res) => {
    const { nid, license, name, surname, farmacia, cuit_farmacia, mail, password } = req.body;

    // Verificación de matrícula
    try {
        const verifyResponse = await axios.post('http://localhost:5000/verify', { license });
        if (!verifyResponse.data.valid) {
            return res.status(400).send('Matrícula no válida.');
        }
    } catch (err) {
        return res.status(500).send('Error verificando matrícula.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newPharmacist = new Pharmacist({ nid, license, name, surname, farmacia, cuit_farmacia, mail, password: hashedPassword });
    try {
        await newPharmacist.save();
        res.send('Farmacéutico registrado.');
    } catch (err) {
        res.status(400).send(err);
    }
});

// Registro de obras sociales
app.post('/register_obra_social', async (req, res) => {
    const { name, surname, nid, razon_social, cuit_os, mail, password } = req.body;

    // Verifica si ya existe una obra social con el mismo DNI
    const existingInsurance = await Insurance.findOne({ nid });
    if (existingInsurance) {
        return res.status(400).send('Una obra social con este DNI ya está registrada.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newInsurance = new Insurance({ name, surname, nid, razon_social, cuit_os, mail, password: hashedPassword });
    try {
        await newInsurance.save();
        res.send('Obra social registrada.');
    } catch (err) {
        res.status(400).send(err);
    }
});

// Login
app.post('/login', async (req, res) => {
    const { nid, password, userType } = req.body;
    let user;
    switch (userType) {
        case 'medico':
            user = await Doctor.findOne({ nid });
            break;
        case 'farmaceutico':
            user = await Pharmacist.findOne({ nid });
            break;
        case 'paciente':
            user = await Patient.findOne({ nid });
            break;
        case 'obra_social':
            user = await Insurance.findOne({ nid });
            break;
        default:
            return res.status(400).send('Tipo de usuario inválido');
    }

    if (user && await bcrypt.compare(password, user.password)) {
        const token = jwt.sign({ nid, userType }, SECRET_KEY);
        res.json({ token });
    } else {
        res.status(401).send('Credenciales inválidas');
    }
});




app.listen(3001, () => console.log('Server running on port 3001'));
