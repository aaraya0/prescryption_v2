const Insurance = require('../models/Insurance');
const blockchainService = require('../services/blockchainService');

// Obtener perfil de usuario de obra social
exports.getUserProfile = async (req, res) => {
    try {
        const { nid } = req.user;
        const insurance = await Insurance.findOne({ nid });
        if (!insurance) {
            return res.status(404).send('Insurance provider not found.');
        }
        res.json(insurance);
    } catch (err) {
        res.status(500).send('Error fetching profile: ' + err.message);
    }
};