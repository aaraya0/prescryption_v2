const fs = require('fs');
const path = require('path');
const { Web3 } = require('web3');

let web3;
let systemAccount;
let prescriptionContract;

async function initBlockchain() {
    web3 = new Web3('http://127.0.0.1:8545');  // Ganache Desktop por ahora

    const accounts = await web3.eth.getAccounts();
    systemAccount = {
        address: accounts[0],
        privateKey: null
    };

    // Rutas absolutas y siempre correctas
    const contractsDataPath = path.resolve(__dirname, '../../../prescryption_solidity/contracts_data.json');
    const contractBuildPath = path.resolve(__dirname, '../../../prescryption_solidity/build/contracts/PrescriptionContract.json');

    const contractsData = JSON.parse(fs.readFileSync(contractsDataPath));
    const contractJSON = JSON.parse(fs.readFileSync(contractBuildPath));

    prescriptionContract = new web3.eth.Contract(contractJSON.abi, contractsData.PrescriptionContract);
}

function getWeb3() {
    return web3;
}

function getSystemAccount() {
    return systemAccount;
}

function getPrescriptionContract() {
    return prescriptionContract;
}

module.exports = {
    initBlockchain,
    getWeb3,
    getSystemAccount,
    getPrescriptionContract
};
