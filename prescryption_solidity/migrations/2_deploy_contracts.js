const fs = require('fs');
const path = require('path');

const PrescriptionContract = artifacts.require("PrescriptionContract");

module.exports = async function(deployer) {
   
    await deployer.deploy(PrescriptionContract);
    const prescriptionContractInstance = await PrescriptionContract.deployed();

    // Guardar las direcciones en un archivo JSON
    const contractsData = {
        PrescriptionContract: prescriptionContractInstance.address
    };

    const outputPath = path.resolve(__dirname, '../contracts_data.json');
    fs.writeFileSync(outputPath, JSON.stringify(contractsData, null, 2), 'utf-8');
};
