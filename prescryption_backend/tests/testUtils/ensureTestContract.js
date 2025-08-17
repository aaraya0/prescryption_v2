// tests/testUtils/ensureTestContract.js
const fs = require('fs');
const path = require('path');
const { getWeb3, getSystemAccount } = require('./initBlockchainTestEnv');

function findFirstExisting(paths) {
  for (const p of paths) { try { if (fs.existsSync(p)) return p; } catch {} }
  return null;
}

function resolveBuildJsonPath() {
  const candidates = [
    path.resolve(__dirname, '../../../prescryption_solidity/build/contracts/PrescriptionContract.json'),
    path.resolve(process.cwd(), '../prescryption_solidity/build/contracts/PrescriptionContract.json'),
    path.resolve(__dirname, '../../prescryption_solidity/build/contracts/PrescriptionContract.json'),
    path.resolve(process.cwd(), 'prescryption_solidity/build/contracts/PrescriptionContract.json'),
  ];
  const hit = findFirstExisting(candidates);
  if (!hit) {
    throw new Error(
      'No pude encontrar build/contracts/PrescriptionContract.json. Probé:\n- ' +
      candidates.join('\n- ')
    );
  }
  return hit;
}

async function ensureTestContract() {
  const web3 = getWeb3();
  const system = getSystemAccount();

  const buildPath = resolveBuildJsonPath();
  const buildJSON = JSON.parse(fs.readFileSync(buildPath, 'utf8'));

  // ⚠️ SIEMPRE desplegar un contrato de test para asegurar ABI=bytecode
  console.log('[ensureTestContract] deploying fresh test contract...');
  const Contract = new web3.eth.Contract(buildJSON.abi);
  const instance = await Contract.deploy({ data: buildJSON.bytecode })
    .send({ from: system.address, gas: 6_000_000 });

  const addr = instance.options.address;
  const code = await web3.eth.getCode(addr);
  console.log('[ensureTestContract] deployed at', addr, 'code len =', (code || '').length);

  // Persistimos el path de tests, sin tocar prod
  const tmpDir = path.resolve(__dirname, '../.tmp');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  const tmpPath = path.join(tmpDir, 'contracts_data.test.json');
  fs.writeFileSync(tmpPath, JSON.stringify({ PrescriptionContract: addr }, null, 2));
  process.env.CONTRACTS_DATA_TEST_PATH = tmpPath;

  return { address: addr, abi: buildJSON.abi };
}

module.exports = { ensureTestContract };
