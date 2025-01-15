const jwt = require('jsonwebtoken');
require('dotenv').config();

const generateToken = (user) => {
    return jwt.sign(user, process.env.SECRET_KEY, { expiresIn: '1h' });
};

module.exports = generateToken;
