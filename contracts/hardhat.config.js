require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 1337
    },
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    // Add your network configurations here
    // Example:
    // mainnet: {
    //   url: `https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`,
    //   accounts: [process.env.PRIVATE_KEY]
    // }
  }
};