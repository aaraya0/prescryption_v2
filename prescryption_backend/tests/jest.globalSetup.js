// tests/jest.globalSetup.js
const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '../.env.test'),
  override: true
});
const fs = require('fs');
const deploy = require('./scripts/deployTestContracts');

module.exports = async () => {
  const outPath = path.resolve(__dirname, '.tmp/contracts_data.test.json');
  if (!fs.existsSync(outPath)) {
    await deploy(); // genera el test json con el provider de .env.test
  }
  process.env.CONTRACTS_DATA_TEST_PATH = outPath; // opcional (tenés fallback en el patch)
};
