const { Web3 } = require("web3");
require("dotenv").config();

const web3 = new Web3(`https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`);
const faucetAccount = web3.eth.accounts.privateKeyToAccount(process.env.FAUCET_PRIVATE_KEY);
web3.eth.accounts.wallet.add(faucetAccount);

async function fundNewAccount(address) {
  return await web3.eth.sendTransaction({
    from: faucetAccount.address,
    to: address,
    value: web3.utils.toWei("0.01", "ether"),
    gas: 21000
  });
}

async function fundIfLow(address, minBalanceEth = "0.005") {
  console.log(`🔍 [fundIfLow] Revisando saldo de ${address}...`);
  
  const balanceWei = await web3.eth.getBalance(address);
  const balanceEth = web3.utils.fromWei(balanceWei, "ether");
  
  console.log(`💰 [fundIfLow] Saldo actual: ${balanceEth} ETH`);

  if (parseFloat(balanceEth) < parseFloat(minBalanceEth)) {
    console.log(`⚠️ [fundIfLow] Saldo bajo (${balanceEth} ETH). Enviando recarga...`);
    const tx = await fundNewAccount(address);
    console.log(`✅ [fundIfLow] Recarga enviada. TX Hash: ${tx.transactionHash}`);
    return tx;
  } else {
    console.log(`✅ [fundIfLow] Saldo suficiente, no se recarga.`);
  }
}

module.exports = { fundNewAccount, fundIfLow };
