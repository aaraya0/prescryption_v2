const jwt = require('jsonwebtoken');
require('dotenv').config();

const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(403).send('Token required');

    try {
        req.user = jwt.verify(token, process.env.SECRET_KEY);
        next();
    } catch {
        res.status(401).send('Invalid token');
    }
};

module.exports = authMiddleware;
