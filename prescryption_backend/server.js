const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();

// Configurar CORS
app.use(cors({
    origin: 'http://localhost:3000', // Reemplaza con la URL de tu frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

app.use(bodyParser.json());

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error(err));

const doctorSchema = new mongoose.Schema({
    dni: { type: String, required: true, unique: true },
    matricula: { type: String, required: true },
    nombre: { type: String, required: true },
    apellido: { type: String, required: true },
    especialidad: { type: String, required: true },
    password: { type: String, required: true }
});

const Doctor = mongoose.model('Doctor', doctorSchema);

const SECRET_KEY = process.env.SECRET_KEY;

app.post('/register', async (req, res) => {
    const { dni, matricula, nombre, apellido, especialidad, password } = req.body;

    // Verificar la matrícula y el DNI
    try {
        const verifyResponse = await axios.post('http://localhost:5000/verify', { dni, matricula });
        if (!verifyResponse.data.valid) {
            return res.status(400).send('Matrícula o DNI no válido');
        }
    } catch (err) {
        return res.status(500).send('Error verificando matrícula o DNI');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newDoctor = new Doctor({ dni, matricula, nombre, apellido, especialidad, password: hashedPassword });
    try {
        await newDoctor.save();
        res.send('Doctor registered');
    } catch (err) {
        res.status(400).send(err);
    }
});

app.post('/login', async (req, res) => {
    const { dni, matricula, password } = req.body;
    const doctor = await Doctor.findOne({ dni, matricula });
    if (doctor && await bcrypt.compare(password, doctor.password)) {
        const token = jwt.sign({ dni, matricula }, SECRET_KEY);
        res.json({ token });
    } else {
        res.status(401).send('Invalid credentials');
    }
});

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).send('Token is required');
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.doctor = decoded;
        next();
    } catch (err) {
        return res.status(401).send('Invalid Token');
    }
};

app.listen(3001, () => console.log('Server running on port 3001'));
