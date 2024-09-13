require('@nomiclabs/hardhat-ethers');
require('@nomiclabs/hardhat-waffle');

const { PrivateKey } = require('./secret.json');

module.exports = {
  defaultNetwork: 'core_testnet',
  networks: {
    hardhat: {
      chainId: 31337 // Añadido para Hardhat Network, opcional
    },
    core_testnet: {
      url: 'https://rpc.test.btcs.network',
      accounts: [`0x${PrivateKey}`], // Asegúrate de que la clave esté en formato hexadecimal
      chainId: 1115,
    }
  },
  solidity: {
    version: '0.8.24',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  paths: {
    sources: './contracts',
    cache: './cache',
    artifacts: './artifacts',
  },
  mocha: {
    timeout: 20000,
  }
};
