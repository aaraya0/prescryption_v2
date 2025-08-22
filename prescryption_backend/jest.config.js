// jest.config.js
module.exports = {
  testEnvironment: 'node',
  testTimeout: 15000,

  // before any test
  globalSetup: '<rootDir>/tests/jest.globalSetup.js',

  // after test env
  setupFilesAfterEnv: ['<rootDir>/tests/jest.setupAfterEnv.js'],

  // setup
  setupFiles: ['<rootDir>/jest.setup.js'],

  testMatch: ['**/tests/**/*.test.js']
};
