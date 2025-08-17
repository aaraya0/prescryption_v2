// tests/integration/pharmacyService.test.js
// ✔ Sin setupIntegrationTest: la conexión a Mongo la maneja jest.setupAfterEnv.js
const Pharmacy = require('../../models/Pharmacy');
const { getWeb3 } = require('../testUtils/initBlockchainTestEnv');
const { encrypt } = require('../../utils/encryption');

describe('Pharmacy Service Integration Test', () => {
  it('debería registrar una farmacia correctamente', async () => {
    const web3 = getWeb3();                    // reutiliza el web3 inicializado para tests
    const account = web3.eth.accounts.create();

    const newPharmacy = await Pharmacy.create({
      nid: 'PHARM001',
      pharmacy_name: 'Farmacia Central',
      mail: 'farmacia@mail.com',
      password: 'hashedpassword',
      address: account.address,
      privateKey: encrypt(account.privateKey), // homogeneizamos cifrado
      physicalAddress: 'Av. Siempreviva 123',
      contactInfo: 'Tel: 123456',
      verificationCode: 'abc123'
    });

    expect(newPharmacy).toBeTruthy();
    expect(newPharmacy.pharmacy_name).toBe('Farmacia Central');
    expect(newPharmacy.address).toBe(account.address);
  });
});
