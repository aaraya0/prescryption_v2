const bcrypt = require('bcryptjs');
const connectDB = require('./db'); 
const AdminUser = require('../models/AdminUser'); 
require('dotenv').config(); 
const createAdmin = async () => {
    await connectDB(); 
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
        process.exit(); 
    }
};

createAdmin();
