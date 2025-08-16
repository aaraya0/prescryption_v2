const HDWalletProvider = require("@truffle/hdwallet-provider");
require("dotenv").config();

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1", // Ganache
      port: 7545,        // Ganache port
      network_id: "*",   // any network id
    },
    sepolia: {
      provider: () =>
        new HDWalletProvider(
          process.env.FAUCET_PRIVATE_KEY, // private acc in ETH testnet
          `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`
        ),
      network_id: 11155111, // Sepolia id
      confirmations: 2,     
      timeoutBlocks: 200,
      skipDryRun: true,
    },
  },
  compilers: {
    solc: {
      version: "0.8.20",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
        viaIR: true,
      },
    },
  },
};
