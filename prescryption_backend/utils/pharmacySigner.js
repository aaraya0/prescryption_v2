const { web3 } = require('./systemSigner'); 
const Pharmacy = require('../models/Pharmacy');
const { decrypt } = require('./encryption');

exports.getPharmacySigner = async (pharmacyNid) => {
    const pharmacy = await Pharmacy.findOne({ nid: pharmacyNid });
    if (!pharmacy) {
        throw new Error('Pharmacy not found');
    }

    const decryptedKey = decrypt(pharmacy.privateKey);
    const account = web3.eth.accounts.privateKeyToAccount(decryptedKey);
    web3.eth.accounts.wallet.add(account);

    return account;
};
