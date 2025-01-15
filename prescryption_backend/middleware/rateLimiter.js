const loginAttemptCache = {};

const loginLimiter = (req, res, next) => {
    const { nid } = req.body;
    const now = Date.now();
    const windowMs = 15 * 60 * 1000;

    if (!loginAttemptCache[nid]) loginAttemptCache[nid] = { attempts: 0, lastAttempt: now };

    if (now - loginAttemptCache[nid].lastAttempt > windowMs) {
        loginAttemptCache[nid].attempts = 0;
    }

    loginAttemptCache[nid].attempts++;
    loginAttemptCache[nid].lastAttempt = now;

    if (loginAttemptCache[nid].attempts > 5) {
        return res.status(429).send('Too many login attempts');
    }

    next();
};

module.exports = loginLimiter;
