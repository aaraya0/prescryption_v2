require('./setupIntegrationTest');
const Pharmacy = require('../../models/Pharmacy');
const { Web3 } = require('web3');

describe('Pharmacy Service Integration Test', () => {

    it('debería registrar una farmacia correctamente', async () => {
        const web3 = new Web3();
        const account = web3.eth.accounts.create();

        const newPharmacy = new Pharmacy({
            nid: 'PHARM001',
            pharmacy_name: 'Farmacia Central',
            mail: 'farmacia@mail.com',
            password: 'hashedpassword',
            address: account.address,
            privateKey: account.privateKey,
            physicalAddress: 'Av. Siempreviva 123',
            contactInfo: 'Tel: 123456',
            verificationCode: 'abc123'
        });

        const savedPharmacy = await newPharmacy.save();

        expect(savedPharmacy.pharmacy_name).toBe('Farmacia Central');
        expect(savedPharmacy.address).toBe(account.address);
    });

});
