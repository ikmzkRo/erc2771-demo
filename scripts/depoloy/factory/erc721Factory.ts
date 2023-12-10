import { ethers } from "hardhat";

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

  let tx = await ikmzERC721Factory.createIkmzERC721(name, symbol, baseTokenURI, admin, trustedForwarder);
  try {
    await tx.wait();
  } catch (error) {
    console.log('error', error)
  }

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});