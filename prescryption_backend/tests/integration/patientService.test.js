require('./setupIntegrationTest');
const Patient = require('../../models/Patient');
const { Web3 } = require('web3');

describe('Patient Service Integration Test', () => {

    it('debería registrar un paciente correctamente', async () => {
        const web3 = new Web3();
        const account = web3.eth.accounts.create();

        const newPatient = new Patient({
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

        const savedPatient = await newPatient.save();

        expect(savedPatient.name).toBe('Juan');
        expect(savedPatient.insurance_name).toBe('OSDE');
        expect(savedPatient.address).toBe(account.address);
    });

});
