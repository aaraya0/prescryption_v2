const bcrypt = require('bcryptjs');
const connectDB = require('./db'); // Ruta al archivo que compartiste
const AdminUser = require('../models/AdminUser'); // Ruta a tu modelo de admin
require('dotenv').config(); // 👈 Esto carga las variables del .env

const createAdmin = async () => {
    await connectDB(); // 👈 Conecta a la DB usando tu función existente

    const hashedPassword = await bcrypt.hash("admin1234", 10);

    const newAdmin = new AdminUser({
        nid: "99999999",
        name: "Admin Root",
        mail: "admin@prescryption.com",
        password: hashedPassword
    });

    try {
        await newAdmin.save();
        console.log("✅ Admin creado correctamente");
    } catch (err) {
        console.error("❌ Error al crear admin:", err.message);
    } finally {
        process.exit(); // Cierra el proceso después de ejecutar
    }
};

createAdmin();
