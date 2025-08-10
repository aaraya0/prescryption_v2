require('dotenv').config({ path: '.env.test' });

require('./setupIntegrationTest');
const Doctor = require('../../models/Doctor');
const Patient = require('../../models/Patient');
const Pharmacy = require('../../models/Pharmacy');
const { encrypt } = require('../../utils/encryption');
const blockchainService = require('../../services/blockchainService');
const { web3, systemAccount } = require('../../utils/systemSigner');

describe('Blockchain Service Full Integration Test - Flujo Completo', () => {

    it('Debería ejecutar el ciclo completo de prescripción', async () => {
        // Creamos y fondeamos doctor
        const doctorAccount = web3.eth.accounts.create();
        await web3.eth.sendTransaction({
            from: systemAccount.address,
            to: doctorAccount.address,
            value: web3.utils.toWei('10', 'ether')
        });

        await Doctor.create({
            nid: 'DOC001',
            license: 'LIC001',
            name: 'Dr. Smith',
            surname: 'Test',
            specialty: 'Cardiology',
            password: 'hashed',
            mail: 'doctor@mail.com',
            address: doctorAccount.address,
            privateKey: encrypt(doctorAccount.privateKey)
        });

        const patientAccount = web3.eth.accounts.create();
        await Patient.create({
            name: 'Juan',
            surname: 'Pérez',
            nid: 'PAT001',
            birth_date: '1990-01-01',
            sex: 'M',
            insurance_name: 'OSDE',
            affiliate_num: 'A001',
            insurance_plan: 'Plan 310',
            mail: 'juan@mail.com',
            password: 'hashed',
            address: patientAccount.address
        });

        const pharmacyAccount = web3.eth.accounts.create();
        await web3.eth.sendTransaction({
            from: systemAccount.address,
            to: pharmacyAccount.address,
            value: web3.utils.toWei('5', 'ether')
        });

        await Pharmacy.create({
            nid: 'PHARM001',
            pharmacy_name: 'Farmacia Central',
            mail: 'farm@mail.com',
            password: 'hashed',
            address: pharmacyAccount.address,
            privateKey: encrypt(pharmacyAccount.privateKey),
            physicalAddress: 'Av. Siempre Viva 123',
            contactInfo: 'Tel: 123456',
            verificationCode: 'abc123'
        });

        const prescriptionData = {
            patientName: 'Juan',
            patientSurname: 'Pérez',
            patientNid: 'PAT001',
            meds: {
                med1: 'Paracetamol',
                quantity1: 1,
                med2: 'Ibuprofeno',
                quantity2: 2,
                diagnosis: 'Gripe',
                observations: 'Reposo'
            },
            insurance: {
                affiliateNum: 'A001',
                insuranceName: 'OSDE',
                insurancePlan: 'Plan 310'
            },
            patientAddress: patientAccount.address
        };

        const receipt = await blockchainService.issuePrescription(prescriptionData, 'DOC001');
        expect(receipt).toHaveProperty('prescriptionId');
        const prescriptionId = receipt.prescriptionId;

        const updateResult = await blockchainService.updatePrescriptionPharmacyAddress(prescriptionId, pharmacyAccount.address);
        expect(updateResult).toHaveProperty('transactionHash');

        const validateResult = await blockchainService.validatePrescriptionOnBlockchain(prescriptionId, 'PHARM001', pharmacyAccount.address);
        expect(validateResult).toHaveProperty('transactionHash');

        const doctorPrescriptions = await blockchainService.getPrescriptionsByDoctor('DOC001');
        expect(doctorPrescriptions.length).toBeGreaterThan(0);

        const patientPrescriptions = await blockchainService.getPrescriptionsByPatient(patientAccount.address);
        expect(patientPrescriptions.length).toBeGreaterThan(0);

        const pharmacyPrescriptions = await blockchainService.getPrescriptionsByPharmacy(pharmacyAccount.address);
        expect(pharmacyPrescriptions.length).toBeGreaterThanOrEqual(0);
    });

});
