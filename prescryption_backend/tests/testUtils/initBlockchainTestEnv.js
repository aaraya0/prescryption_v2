const fs = require('fs');
const path = require('path');
const { Web3 } = require('web3');

let web3;
let systemAccount;
let prescriptionContract;

function resolveExisting(...candidates) {
  for (const rel of candidates) {
    const abs = path.resolve(__dirname, rel);
    if (fs.existsSync(abs)) return abs;
  }
  throw new Error('No se encontró la ruta indicada. Revisá prescryption_solidity/*');
}

async function initBlockchain() {
  const providerUrl = process.env.BLOCKCHAIN_PROVIDER_URL || 'http://127.0.0.1:7545';
  web3 = new Web3(providerUrl);

  const netId = await web3.eth.net.getId().catch(() => 'NA');
  console.log(`[CHAIN] provider=${providerUrl} netId=${netId}`);

  const accounts = await web3.eth.getAccounts();
  systemAccount = { address: accounts[0], privateKey: null };
  console.log(`[CHAIN] systemAccount=${systemAccount.address}`);

  // ABI
  const abiPath = resolveExisting(
    '../../../prescryption_solidity/build/contracts/PrescriptionContract.json',
    '../../../../prescryption_solidity/build/contracts/PrescriptionContract.json'
  );
  const abi = JSON.parse(fs.readFileSync(abiPath, 'utf8')).abi;

  const cdPath = resolveExisting(
    '../../../prescryption_solidity/contracts_data.json',
    '../../../../prescryption_solidity/contracts_data.json'
  );
  const { PrescriptionContract } = JSON.parse(fs.readFileSync(cdPath, 'utf8'));
  console.log(`[CHAIN] contractAddress=${PrescriptionContract}`);

  const code = await web3.eth.getCode(PrescriptionContract);
  console.log(`[CHAIN] codeAtAddress=${code && code.length > 2 ? 'present' : 'EMPTY'}`);

  prescriptionContract = new web3.eth.Contract(abi, PrescriptionContract);
}

function getWeb3() {
  if (!web3) throw new Error('initBlockchain() no fue llamado');
  return web3;
}
function getSystemAccount() {
  if (!systemAccount) throw new Error('initBlockchain() no fue llamado');
  return systemAccount;
}
function getContract() {
  if (!prescriptionContract) throw new Error('initBlockchain() no fue llamado');
  return prescriptionContract;
}

module.exports = { initBlockchain, getWeb3, getSystemAccount, getContract };
