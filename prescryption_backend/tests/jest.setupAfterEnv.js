// tests/jest.setupAfterEnv.js
const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '../.env.test'),
  override: true
});

const { patchContractsPath } = require('./testUtils/patchContractsPath');
const { connect, closeDatabase } = require('./testUtils/setupTestDB');
const { initBlockchain } = require('./testUtils/initBlockchainTestEnv');

beforeAll(async () => {
  patchContractsPath();   // redirige contracts_data.json a la copia de test
  await connect();        // única conexión a Mongo (memoria)
  await initBlockchain(); // usa BLOCKCHAIN_PROVIDER_URL de .env.test (7545)
});

afterAll(async () => {
  await closeDatabase();  // cierre único y ordenado
});
