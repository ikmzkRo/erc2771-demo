require("@nomiclabs/hardhat-waffle");
require("dotenv").config();
require("@nomiclabs/hardhat-etherscan");
import "hardhat-gas-reporter";
import "@nomiclabs/hardhat-ethers";

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.17",
  networks: {
    goerli: {
      url: `https://eth-goerli.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      gas: 2000000, // 手動でガスリミットを設定
      accounts: [process.env.PRIVATE_KEY],
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS
      ? process.env.REPORT_GAS.toLocaleLowerCase() === "true"
      : false,
    currency: "JPY",
    gasPrice: 21, // Use an appropriate gas price for your network
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
};
