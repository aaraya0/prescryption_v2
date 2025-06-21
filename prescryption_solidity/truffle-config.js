const HDWalletProvider = require("@truffle/hdwallet-provider");
require("dotenv").config();

module.exports = {
  networks: {
    networks: {
      // >>> Añade esta sección para Ganache local <<<
      development: {
        host: "127.0.0.1", // dirección donde corre Ganache
        port: 7545, // puerto de Ganache (puede variar)
        network_id: "*", // acepta cualquier network id
      },
      sepolia: {
        provider: () =>
          new HDWalletProvider(
            process.env.FAUCET_PRIVATE_KEY, // clave privada de la cuenta con ETH testnet
            `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`
          ),
        network_id: 11155111, // ID de red de Sepolia
        confirmations: 2, // Espera 2 confirmaciones
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
          viaIR: true, // ✅ esta línea vuelve a ser necesaria
        },
      },
    },
  },
};
