const {Web3} = require("web3");
require("dotenv").config();

const web3 = new Web3(`https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`);
console.log("FAUCET KEY:", process.env.FAUCET_PRIVATE_KEY);

const faucetAccount = web3.eth.accounts.privateKeyToAccount(process.env.FAUCET_PRIVATE_KEY);
web3.eth.accounts.wallet.add(faucetAccount);

async function fundNewAccount(address) {
    return await web3.eth.sendTransaction({
        from: faucetAccount.address,
        to: address,
        value: web3.utils.toWei("0.01", "ether"),
        gas: 21000
    });
}

module.exports = fundNewAccount;
