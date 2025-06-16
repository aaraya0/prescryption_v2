module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/jest.setup.js'],
  testTimeout: 15000 // aumento general por si hay algunos mocks pesados
};
