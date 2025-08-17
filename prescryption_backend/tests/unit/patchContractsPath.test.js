// tests/unit/patchContractsPath.test.js
const fs = require('fs');
const os = require('os');
const path = require('path');

describe('tests/testUtils/patchContractsPath', () => {
  const REAL_READ = fs.readFileSync;

  afterEach(() => {
    // Restauramos readFileSync tras cada test por seguridad
    fs.readFileSync = REAL_READ;
    delete process.env.CONTRACTS_DATA_TEST_PATH;
  });

  it('redirige la lectura de contracts_data.json al archivo alternativo', () => {
    const tmpFile = path.join(os.tmpdir(), `contracts_data.alt.${Date.now()}.json`);
    const expected = JSON.stringify({ PrescriptionContract: '0xDEADBEEF' });
    fs.writeFileSync(tmpFile, expected, 'utf8');

    process.env.CONTRACTS_DATA_TEST_PATH = tmpFile;

    const { patchContractsPath } = require('../testUtils/patchContractsPath');
    patchContractsPath();

    const targetPath = path.join(
      __dirname,
      '..',
      '..',
      'prescryption_solidity',
      'contracts_data.json'
    );

    const buf = fs.readFileSync(targetPath, 'utf8');
    expect(buf).toBe(expected);
  });

  it('no toca otras lecturas de archivos', () => {
    const someFile = path.join(os.tmpdir(), `plain.${Date.now()}.txt`);
    fs.writeFileSync(someFile, 'hola', 'utf8');

    process.env.CONTRACTS_DATA_TEST_PATH = someFile; // aunque lo setee, no debería afectar rutas distintas

    const { patchContractsPath } = require('../testUtils/patchContractsPath');
    patchContractsPath();

    // Leemos otro path distinto (no termina en /prescryption_solidity/contracts_data.json)
    const content = fs.readFileSync(someFile, 'utf8');
    expect(content).toBe('hola');
  });
});
