// tests/integration/prescriptionService.test.js
console.log('### USING NEW INTEGRATION TEST v9i (ensure before require service + BigInt) ###');
require('dotenv').config({ path: '.env.test' });

// Mock faucet externo
jest.mock('../../utils/fundAccount', () => ({
  __esModule: true,
  default: async () => ({ txHash: '0xMOCK' }),
  fundNewAccount: async () => ({ txHash: '0xMOCK' }),
  fundIfLow: async () => ({ funded: false }),
}));

const { getWeb3, getSystemAccount } = require('../testUtils/initBlockchainTestEnv');
const { ensureTestContract } = require('../testUtils/ensureTestContract');
const { patchContractsPath } = require('../testUtils/patchContractsPath');

const Doctor = require('../../models/Doctor');
const Patient = require('../../models/Patient');
const Pharmacy = require('../../models/Pharmacy');
const { encrypt, decrypt } = require('../../utils/encryption');

const lc = (s) => (s || '').toLowerCase();

describe('Blockchain Service – Integración (flujo completo)', () => {
  it('debería ejecutar el ciclo completo de la receta', async () => {
    const web3 = getWeb3();
    const system = getSystemAccount();

    // ⚠️ Asegurar contrato y patch ANTES de cargar el service
    await ensureTestContract();
    patchContractsPath();

    // Recién ahora requerimos el service (ya lee el contracts_data.test.json)
    const blockchainService = require('../../services/blockchainService');

    // Cuentas y docs (bypass hooks)
    const doctorAcc = web3.eth.accounts.create();
    await web3.eth.sendTransaction({ from: system.address, to: doctorAcc.address, value: web3.utils.toWei('0.1', 'ether') });
    const doctorDoc = {
      nid: 'DOC001', license: 'LIC001', name: 'Dr', surname: 'Smith', specialty: 'Cardio',
      mail: 'doctor@mail.com', password: 'h', address: doctorAcc.address, privateKey: encrypt(doctorAcc.privateKey),
    };
    const docRes = await Doctor.collection.insertOne(doctorDoc);
    const doctor = { ...doctorDoc, _id: docRes.insertedId };
    const recDoc = web3.eth.accounts.privateKeyToAccount(decrypt(doctor.privateKey)).address;
    expect(lc(recDoc)).toBe(lc(doctor.address));

    const patientAcc = web3.eth.accounts.create();
    const patientDoc = { nid: 'PAT001', name: 'Juan', surname: 'Pérez', mail: 'p@mail.com', password: 'h', address: patientAcc.address };
    const patRes = await Patient.collection.insertOne(patientDoc);
    const patient = { ...patientDoc, _id: patRes.insertedId };

    const pharmacyAcc = web3.eth.accounts.create();
    await web3.eth.sendTransaction({ from: system.address, to: pharmacyAcc.address, value: web3.utils.toWei('0.1', 'ether') });
    const pharmacyDoc = {
      nid: 'PHARM001', pharmacy_name: 'Farmacia Central', mail: 'f@mail.com', password: 'h',
      address: pharmacyAcc.address, privateKey: encrypt(pharmacyAcc.privateKey),
      physicalAddress: 'Av. Siempreviva 123', contactInfo: '123456',
    };
    const phRes = await Pharmacy.collection.insertOne(pharmacyDoc);
    const pharmacy = { ...pharmacyDoc, _id: phRes.insertedId };
    const recPh = web3.eth.accounts.privateKeyToAccount(decrypt(pharmacy.privateKey)).address;
    expect(lc(recPh)).toBe(lc(pharmacy.address));

    // Datos
    const meds = { med1: 'Paracetamol 500mg', quantity1: 1, med2: '', quantity2: 0, diagnosis: '', observations: '' };
    const insurance = { affiliateNum: '', insuranceName: 'OSDE', insurancePlan: '210' };

    // ISSUE
    const issueRes = await blockchainService.issuePrescription(
      {
        patientName: patient.name,
        patientSurname: patient.surname,
        patientNid: patient.nid,
        meds,
        insurance,
        patientAddress: patient.address,
      },
      doctor.nid
    );
    const prescriptionId = issueRes.prescriptionId;
    expect(prescriptionId).toBeDefined();

    // UPDATE
    await blockchainService.updatePrescriptionPharmacyAddress(prescriptionId, pharmacy.address);

    // VALIDATE
    await blockchainService.validatePrescriptionOnBlockchain(prescriptionId, pharmacy.nid, pharmacy.address);
  });
});
