// tests/acceptance/prescription.e2e.test.js
/* eslint-disable no-console */
console.log('### E2E — simple (service end-to-end, patch antes de server) ###');

const path = require('path');

// Cargar variables de test (sin pisar las ya presentes en el entorno)
require('dotenv').config({ path: path.resolve(__dirname, './.env.test'), override: false });

// ---- Mocks de test (deben declararse ANTES de requerir el server) ----

// 1) Mock del faucet: evitamos dependencias externas durante E2E
jest.mock('../../utils/fundAccount', () => ({
  __esModule: true,
  default: async () => ({ txHash: '0xMOCK' }),
  fundNewAccount: async () => ({ txHash: '0xMOCK' }),
  fundIfLow: async () => ({ funded: false }),
}));

// 2) Mock del authMiddleware: valida el JWT con SECRET_KEY, respeta el rol requerido,
//    y cuelga req.user y req.doctor (si role === 'doctor') para que pasen los controladores.
jest.mock('../../middleware/authMiddleware', () => {
  const jwt = require('jsonwebtoken');
  return (requiredRole) => (req, res, next) => {
    try {
      const auth = req.headers.authorization || '';
      const token = auth.split(' ')[1];
      const SECRET = process.env.SECRET_KEY;
      const decoded = jwt.verify(token, SECRET);

      req.user = decoded;
      if (decoded.role === 'doctor') {
        // muchos controladores esperan req.doctor además de req.user
        req.doctor = { _id: decoded.id, nid: decoded.nid };
      }

      if (requiredRole && decoded.role !== requiredRole) {
        return res.status(403).json({ message: `Forbidden: requires ${requiredRole}` });
      }
      return next();
    } catch (e) {
      return res.status(401).json({ message: 'Unauthorized (test auth mock)' });
    }
  };
});

// ----------------------------------------------------------------------

const jwt = require('jsonwebtoken');
const request = require('supertest');

const { getWeb3, getSystemAccount } = require('../testUtils/initBlockchainTestEnv');
const { ensureTestContract } = require('../testUtils/ensureTestContract');
const { patchContractsPath } = require('../testUtils/patchContractsPath');

const Doctor = require('../../models/Doctor');
const Patient = require('../../models/Patient');
const Pharmacy = require('../../models/Pharmacy');
const { encrypt, decrypt } = require('../../utils/encryption');

// Cuenta de sistema que usa el service en prod (firma updatePrescriptionPharmacyAddress)
const systemSigner = require('../../utils/systemSigner');

const lc = (s) => (s || '').toLowerCase();
const signWithSecret = (payload) =>
  jwt.sign(payload, process.env.SECRET_KEY, { expiresIn: '1h' });

let web3, system, app, blockchainService;

beforeAll(async () => {
  web3 = getWeb3();
  system = getSystemAccount();

  // 1) Desplegar SIEMPRE contrato fresco (mismo build/ABI que usa prod)
  await ensureTestContract(); // escribe tests/.tmp/contracts_data.test.json

  // 2) Parchear lectura de contracts_data para que el backend use el JSON de tests
  patchContractsPath(); // debe ir ANTES de cargar server/service

  // 3) Cargar server y service (ya leen la address de tests)
  app = require('../../server');
  blockchainService = require('../../services/blockchainService');
});

describe('E2E – Emite (service) + asigna farmacia (service) + valida (service) + lista (HTTP doctor)', () => {
  let doctor, patient, pharmacy;

  const meds = {
    med1: 'Paracetamol 500mg',
    quantity1: 1,
    med2: '',
    quantity2: 0,
    diagnosis: '',
    observations: '',
  };
  const insurance = { affiliateNum: '', insuranceName: 'OSDE', insurancePlan: '210' };

  beforeAll(async () => {
    // Doctor con cuenta y PK encriptada
    const docAcc = web3.eth.accounts.create();
    web3.eth.accounts.wallet.add(docAcc.privateKey);
    await web3.eth.sendTransaction({
      from: system.address,
      to: docAcc.address,
      value: web3.utils.toWei('0.1', 'ether'),
    });

    const doctorDoc = {
      nid: 'DOC001',
      license: 'LIC001',
      name: 'Dr',
      surname: 'Who',
      specialty: 'Cardiology',
      mail: 'doc@x',
      password: 'h',
      address: docAcc.address,
      privateKey: encrypt(docAcc.privateKey),
    };
    const docRes = await Doctor.collection.insertOne(doctorDoc);
    doctor = { ...doctorDoc, _id: docRes.insertedId };

    // Verificar round-trip de la PK
    const recDocAddr = web3.eth.accounts.privateKeyToAccount(decrypt(doctor.privateKey)).address;
    if (lc(recDocAddr) !== lc(doctor.address)) throw new Error('ENCRYPTION_SECRET inválido (doctor)');

    // Paciente
    const patAcc = web3.eth.accounts.create();
    const patientDoc = {
      nid: 'PAT001',
      name: 'Juan',
      surname: 'Pérez',
      mail: 'pat@x',
      password: 'h',
      address: patAcc.address,
    };
    const patRes = await Patient.collection.insertOne(patientDoc);
    patient = { ...patientDoc, _id: patRes.insertedId };

    // Farmacia con cuenta y PK encriptada
    const phAcc = web3.eth.accounts.create();
    web3.eth.accounts.wallet.add(phAcc.privateKey);
    await web3.eth.sendTransaction({
      from: system.address,
      to: phAcc.address,
      value: web3.utils.toWei('0.1', 'ether'),
    });

    const pharmacyDoc = {
      nid: 'PHARM001',
      pharmacy_name: 'Farmacia Central',
      mail: 'ph@x',
      password: 'h',
      address: phAcc.address,
      privateKey: encrypt(phAcc.privateKey),
      physicalAddress: 'Av. Siempreviva 123',
      contactInfo: '123456',
    };
    const phRes = await Pharmacy.collection.insertOne(pharmacyDoc);
    pharmacy = { ...pharmacyDoc, _id: phRes.insertedId };

    const recPhAddr = web3.eth.accounts.privateKeyToAccount(decrypt(pharmacy.privateKey)).address;
    if (lc(recPhAddr) !== lc(pharmacy.address)) throw new Error('ENCRYPTION_SECRET inválido (pharmacy)');
  });

  it('debería emitir, asignar farmacia, validar y listar (doctor)', async () => {
    // 1) ISSUE — igual que prod (service usa structs como objetos y uint como Number)
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

    // 2) Fondear la cuenta del systemSigner de prod (la usa updatePrescriptionPharmacyAddress)
    console.log(
      '[TEST FUND] sending ETH from',
      system.address,
      'to prod systemSigner',
      systemSigner.systemAccount.address
    );
    await web3.eth.sendTransaction({
      from: system.address,
      to: systemSigner.systemAccount.address,
      value: web3.utils.toWei('1', 'ether'),
    });

    // 3) Asignar farmacia ON-CHAIN (pending validation) vía service
    await blockchainService.updatePrescriptionPharmacyAddress(prescriptionId, pharmacy.address);

    // 4) Validar ON-CHAIN vía service
    await blockchainService.validatePrescriptionOnBlockchain(
      prescriptionId,
      pharmacy.nid,
      pharmacy.address
    );

    // 5) Listado por DOCTOR (HTTP) — regenero token con el SECRET efectivo
    const doctorToken = signWithSecret({
      id: String(doctor._id),
      role: 'doctor',
      nid: doctor.nid,
    });

    const byDoc = await request(app)
      .get(`/api/doctors/prescriptions`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .expect(200);

    expect(
      Array.isArray(byDoc.body) &&
        byDoc.body.some((p) => String(p.prescriptionId ?? p.id) === String(prescriptionId))
    ).toBe(true);
  });
});
