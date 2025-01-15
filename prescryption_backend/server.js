const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');
const authMiddleware = require('./middleware/authMiddleware');

// Rutas públicas
const publicPatientRoutes = require('./routes/publicPatientRoutes');
const publicDoctorRoutes = require('./routes/publicDoctorRoutes');
const publicPharmacyRoutes = require('./routes/publicPharmacyRoutes');
const authRoutes = require('./routes/authRoutes'); // ✅ Nueva ruta de autenticación

// Rutas protegidas
const patientRoutes = require('./routes/patientRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const prescriptionRoutes = require('./routes/prescriptionRoutes');
const pharmacyRoutes = require('./routes/pharmacyRoutes');

require('dotenv').config();

const app = express();

app.use(cors());
app.use(bodyParser.json());
connectDB();

// ✅ Rutas Públicas (sin autenticación)
app.use('/api/public/patients', publicPatientRoutes);
app.use('/api/public/doctors', publicDoctorRoutes);
app.use('/api/public/pharmacies', publicPharmacyRoutes);
app.use('/api/auth', authRoutes); // Ruta de autenticación

// ✅ Middleware de autenticación para rutas protegidas
app.use(authMiddleware);

// ✅ Rutas Protegidas
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/pharmacies', pharmacyRoutes);

app.listen(3001, () => console.log('✅ Server running on port 3001'));
