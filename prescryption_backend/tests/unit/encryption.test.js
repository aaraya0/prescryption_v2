// tests/unit/encryption.test.js
const path = require('path');

// Cargamos variables de test (si existiera .env.test)
require('dotenv').config({ path: path.resolve(__dirname, '../acceptance/.env.test'), override: false });

describe('utils/encryption', () => {
  const ORIGINAL_SECRET = process.env.ENCRYPTION_SECRET;

  beforeAll(() => {
    // Aseguramos un secreto durante el test
    process.env.ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || 'unit-tests-secret';
  });

  afterAll(() => {
    process.env.ENCRYPTION_SECRET = ORIGINAL_SECRET;
  });

  it('encrypt/decrypt hace round-trip del texto', () => {
    const { encrypt, decrypt } = require('../../utils/encryption');

    const plain = '0xabc1234567890deadbeefcafebabe0000000000000000000000000000000000';
    const cipher = encrypt(plain);

    expect(typeof cipher).toBe('string');
    expect(cipher).not.toEqual(plain);

    const back = decrypt(cipher);
    expect(back).toEqual(plain);
  });

  it('con secreto incorrecto NO devuelve el texto original (o lanza)', () => {
    const { encrypt, decrypt } = require('../../utils/encryption');

    const plain = 'hola-mundo';
    const cipher = encrypt(plain);

    const prev = process.env.ENCRYPTION_SECRET;
    process.env.ENCRYPTION_SECRET = 'otro-secreto';

    let threw = false;
    let result = undefined;
    try {
      result = decrypt(cipher);
    } catch (e) {
      threw = true;
    } finally {
      process.env.ENCRYPTION_SECRET = prev; // restaurar
    }

    // Aceptamos dos comportamientos posibles:
    // - que lance (AES-GCM suele lanzar con auth tag inválida)
    // - o que no lance pero NO devuelva el original
    expect(threw || result !== plain).toBe(true);
  });
});
