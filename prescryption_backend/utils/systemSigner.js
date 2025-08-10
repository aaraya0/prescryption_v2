const { Web3 } = require('web3');
require("dotenv").config();

const provider = process.env.BLOCKCHAIN_PROVIDER_URL || process.env.SEPOLIA_RPC_URL;
const web3 = new Web3(provider);

const privateKey = process.env.SYSTEM_SIGNER_KEY;
const account = web3.eth.accounts.privateKeyToAccount(privateKey);
web3.eth.accounts.wallet.add(account);

module.exports = {
    web3,
    systemAccount: account
};
