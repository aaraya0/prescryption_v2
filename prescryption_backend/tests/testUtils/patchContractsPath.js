// tests/testUtils/patchContractsPath.js
const fs = require('fs');

function patchContractsPath() {
  const realRead = fs.readFileSync;
  const altPath = process.env.CONTRACTS_DATA_TEST_PATH;
  if (!altPath) return;

  fs.readFileSync = function (filePath, ...rest) {
    try {
      const p = String(filePath).replace(/\\/g, '/');
      if (p.endsWith('/prescryption_solidity/contracts_data.json')) {
        console.log(altPath);
        return realRead(altPath, ...rest);
      }
    } catch {}
    return realRead(filePath, ...rest);
  };
}

module.exports = { patchContractsPath };
