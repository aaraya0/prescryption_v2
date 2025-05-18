const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');
const authMiddleware = require('./middleware/authMiddleware');


// Rutas públicas
const publicPatientRoutes = require('./routes/publicPatientRoutes');
const publicDoctorRoutes = require('./routes/publicDoctorRoutes');
const publicPharmacyRoutes = require('./routes/publicPharmacyRoutes');
const publicInsuranceRoutes = require('./routes/publicInsuranceRoutes');
const publicAdminRoutes = require('./routes/publicAdminRoutes');
const authRoutes = require('./routes/authRoutes'); // ✅ Nueva ruta de autenticación

// Rutas protegidas
const patientRoutes = require('./routes/patientRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const prescriptionRoutes = require('./routes/prescriptionRoutes');
const pharmacyRoutes = require('./routes/pharmacyRoutes');
const insuranceRoutes = require('./routes/insuranceRoutes');
const adminRoutes = require('./routes/adminRoutes');
const pharmacyAdminRoutes = require('./routes/pharmacyAdminRoutes');

require('dotenv').config();

const app = express();

app.use(cors());
app.use(bodyParser.json());
connectDB();

// ✅ Rutas Públicas (sin autenticación)
app.use('/api/public/patients', publicPatientRoutes);
app.use('/api/public/doctors', publicDoctorRoutes);
app.use('/api/public/pharmacies', publicPharmacyRoutes);
app.use('/api/public/insurances', publicInsuranceRoutes);
app.use('/api/public/admin', publicAdminRoutes);
app.use('/api/auth', authRoutes); // Ruta de autenticación

// ✅ Middleware de autenticación para rutas protegidas
//app.use(authMiddleware);

// ✅ Rutas Protegidas
app.use('/api/patients', authMiddleware("patient"), patientRoutes);
app.use('/api/doctors', authMiddleware("doctor"), doctorRoutes);
app.use('/api/prescriptions', authMiddleware("doctor"), prescriptionRoutes);
app.use('/api/insurances', authMiddleware("insurance"), insuranceRoutes);
app.use('/api/admin', authMiddleware("admin"), adminRoutes);
app.use('/api/pharmacy-users', authMiddleware("pharmacyUser"), pharmacyRoutes); // empleados
app.use('/api/pharmacies', authMiddleware("pharmacy"), pharmacyAdminRoutes); // entidad farmacia

app.listen(3001, () => console.log('✅ Server running on port 3001'));
