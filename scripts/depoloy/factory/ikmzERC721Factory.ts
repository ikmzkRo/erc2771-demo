import { ethers } from "hardhat";
import fs from 'fs';

async function main() {

  const IkmzERC721Factory = await ethers.getContractFactory(
    "IkmzERC721Factory"
  );
  const ikmzERC721Factory = await IkmzERC721Factory.deploy();
  await ikmzERC721Factory.deployed();

  console.log("IkmzERC721Factory deployed to:", `https://goerli.etherscan.io/address/${ikmzERC721Factory.address}`);

  const name = "testName"
  const symbol = "testSymbol"
  const baseTokenURI = "https://aws/s3_bucket/honyohonyo"
  const admin = "0xa2fb2553e57436b455F57270Cc6f56f6dacDA1a5"
  const trustedForwarder = "0xBd1471fD728dd7e934141a581eC74CEba50FDB16"

  // Verifyで読み込むargument.tsを生成
  fs.writeFileSync("./ikmzERC721Factory_argument.ts",
    `module.exports = ["${name}", "${symbol}", "${baseTokenURI}", "${admin}", "${trustedForwarder}"]`
  );

  let tx = await ikmzERC721Factory.createIkmzERC721(name, symbol, baseTokenURI, admin, trustedForwarder);
  try {
    await tx.wait();
  } catch (error) {
    // ここでデプロイしても失敗する
    // npx hardhat run scripts/depoloy/factory/ikmzERC721Factory.ts --network goerli

    // Verifyしてexplolerからは成功する
    // npx hardhat verify --network goerli 0xE50a4846C103C3DA9c3EC7E5CcDC43a3c9C442C3

    // createIkmzERC721のargumentはikmzERC721Factory_argument.ts

    // internal tx: https://goerli.etherscan.io/tx/0xe33a8d710a0e6be652d295eb8ac93c3e17757149dfcce7f55428cbd0be8c5dc3
    // child CA: https://goerli.etherscan.io/address/0xAF6ce0Fea1E5FC31aCBb40b80D5b1eE49A6c3E7B#internaltx
    console.log('error', error)
  }

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});