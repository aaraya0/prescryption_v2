// tests/scripts/deployTestContracts.js
const fs = require('fs');
const path = require('path');
const { Web3 } = require('web3');

const PROVIDER = process.env.BLOCKCHAIN_PROVIDER_URL || 'http://127.0.0.1:7545';
const web3 = new Web3(PROVIDER);

const contractBuildPath = path.resolve(__dirname, '../../..', 'prescryption_solidity/build/contracts/PrescriptionContract.json');
const outDir = path.resolve(__dirname, '../.tmp');
const outPath = path.join(outDir, 'contracts_data.test.json');

async function deploy() {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const accounts = await web3.eth.getAccounts();
  const deployer = accounts[0];

  const contractJSON = JSON.parse(fs.readFileSync(contractBuildPath, 'utf8'));
  const Contract = new web3.eth.Contract(contractJSON.abi);

  const deployed = await Contract.deploy({
    data: contractJSON.bytecode,
    arguments: [] // si tu ctor no lleva args
  }).send({
    from: deployer,
    gas: 5_000_000
  });

  const contractsData = { PrescriptionContract: deployed.options.address };
  fs.writeFileSync(outPath, JSON.stringify(contractsData, null, 2));
  return outPath;
}

module.exports = deploy;

if (require.main === module) {
  deploy().then((p) => {
    console.log('✔ Test contracts written at:', p);
  }).catch((e) => {
    console.error('❌ Deploy test contracts failed:', e);
    process.exit(1);
  });
}
