const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '../.env.test'),
  override: true
});

const { patchContractsPath } = require('./testUtils/patchContractsPath');
const { connect, closeDatabase } = require('./testUtils/setupTestDB');
const { initBlockchain } = require('./testUtils/initBlockchainTestEnv');

beforeAll(async () => {
  patchContractsPath();   
  await connect();        
  await initBlockchain(); 
});

afterAll(async () => {
  await closeDatabase();  
});
