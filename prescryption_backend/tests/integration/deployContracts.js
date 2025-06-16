const fs = require('fs');
const path = require('path');
const { Web3 } = require('web3');

const contractBuildPath = path.join(__dirname, '../../../prescryption_solidity/build/contracts/PrescriptionContract.json');
const contractsDataPath = path.join(__dirname, '../../../prescryption_solidity/contracts_data.json');

const web3 = new Web3('http://127.0.0.1:8545');


async function deploy() {
  const accounts = await web3.eth.getAccounts();
  const deployer = accounts[0];

  const contractJSON = JSON.parse(fs.readFileSync(contractBuildPath));
  const PrescriptionContract = new web3.eth.Contract(contractJSON.abi);

  const deployedContract = await PrescriptionContract.deploy({
    data: contractJSON.bytecode
  }).send({
    from: deployer,
    gas: 5000000
  });

  console.log("✔ Contract deployed at:", deployedContract.options.address);

  const contractsData = {
    PrescriptionContract: deployedContract.options.address
  };

  fs.writeFileSync(contractsDataPath, JSON.stringify(contractsData, null, 2));
  console.log("✔ contracts_data.json updated");
}

deploy().catch(console.error);
