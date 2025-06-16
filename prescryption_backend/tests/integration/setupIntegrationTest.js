require('dotenv').config({ path: '.env.test' });

const { connect, closeDatabase } = require('../testUtils/setupTestDB');
const { initBlockchain } = require('../testUtils/initBlockchainTestEnv');

beforeAll(async () => {
    await connect();
    await initBlockchain();
});

afterAll(async () => {
    await closeDatabase();
});
