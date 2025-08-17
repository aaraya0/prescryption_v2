// jest.config.js
module.exports = {
  testEnvironment: 'node',
  testTimeout: 15000,

  // antes de correr cualquier test
  globalSetup: '<rootDir>/tests/jest.globalSetup.js',

  // después de levantar el entorno, antes de cada test suite
  setupFilesAfterEnv: ['<rootDir>/tests/jest.setupAfterEnv.js'],

  // si ya tenías un jest.setup.js con polyfills o mocks, lo incluís aquí
  setupFiles: ['<rootDir>/jest.setup.js'],

  // patrones de test
  testMatch: ['**/tests/**/*.test.js']
};
