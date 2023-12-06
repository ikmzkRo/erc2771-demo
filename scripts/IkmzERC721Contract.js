const fs = require("fs");
const { ethers } = require("hardhat");

const main = async () => {
  const name = "kicr"
  const symbol = "ikmz"
  const baseTokenURI = "https://aws/s3_bucket/honyohonyo"
  const admin = "0xa2fb2553e57436b455F57270Cc6f56f6dacDA1a5"
  const trustedForwarder = "0xBd1471fD728dd7e934141a581eC74CEba50FDB16"

  const IkmzERC721 = await ethers.getContractFactory("IkmzERC721");
  const ikmzERC721 = await IkmzERC721.deploy(name, symbol, baseTokenURI, admin, trustedForwarder);
  await ikmzERC721.deployed();

  console.log(`Contract deployed to: https://goerli.etherscan.io/address/${ikmzERC721.address}`);

  const addr1 = "0x91d73e1964a8d2d902b8b708f75259F568725eC1";
  const addr2 = "0x031E628ea16c5197799377E0117bdc9c9B90865b";

  const callerSigner = ethers.provider.getSigner(admin);
  let tx = await ikmzERC721.connect(callerSigner).mint(addr1);
  await tx.wait();
  console.log("NFT#1 minted...");

  fs.writeFileSync("./contracts.ts",
    `export const ikmzERC721ContractAddress = "${ikmzERC721.address}"`
  );

  // Verifyで読み込むargument.tsを生成
  fs.writeFileSync("./ikmzERC721_argument.ts",
    `module.exports = ["${name}", "${symbol}", "${baseTokenURI}", "${admin}", "${trustedForwarder}"]`
  );
}

const ikmzERC721Deploy = async () => {
  try {
    await main();
    process.exit(0);
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
};

ikmzERC721Deploy();