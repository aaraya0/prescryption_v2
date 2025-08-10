const crypto = require("crypto");

function getSecret() {
    const secret = process.env.ENCRYPTION_SECRET;
    if (!secret) {
        throw new Error("ENCRYPTION_SECRET not set");
    }
    return Buffer.from(secret, 'hex');
}

function encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-cbc", getSecret(), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString("hex") + ":" + encrypted.toString("hex");
}

function decrypt(text) {
    const [ivHex, enc] = text.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const encryptedText = Buffer.from(enc, "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", getSecret(), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

module.exports = { encrypt, decrypt };
