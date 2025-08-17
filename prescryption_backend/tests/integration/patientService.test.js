// tests/integration/patientService.test.js
// ✔ Sin setupIntegrationTest: la conexión a Mongo la maneja jest.setupAfterEnv.js
const Patient = require('../../models/Patient');
const { getWeb3 } = require('../testUtils/initBlockchainTestEnv');

describe('Patient Service Integration Test', () => {
  it('debería registrar un paciente correctamente', async () => {
    const web3 = getWeb3();                    // reutiliza el web3 inicializado para tests
    const account = web3.eth.accounts.create();

    const newPatient = await Patient.create({
      name: 'Juan',
      surname: 'Pérez',
      nid: '12345678',
      birth_date: '1990-01-01',
      sex: 'M',
      insurance_name: 'OSDE',
      affiliate_num: 'A001',
      insurance_plan: 'Plan 310',
      mail: 'juan@mail.com',
      password: 'hashedpassword',
      address: account.address
    });

    expect(newPatient).toBeTruthy();
    expect(newPatient.name).toBe('Juan');
    expect(newPatient.insurance_name).toBe('OSDE');
    expect(newPatient.address).toBe(account.address);
  });
});
