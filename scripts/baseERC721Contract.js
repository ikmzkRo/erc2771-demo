const fs = require("fs");

const main = async () => {
  const addr1 = "0x91d73e1964a8d2d902b8b708f75259F568725eC1";
  const addr2 = "0x031E628ea16c5197799377E0117bdc9c9B90865b";

  const tokenURI1 =
    "ipfs://bafybeigyod7ldrnytkzrw45gw2tjksdct6qaxnsc7jdihegpnk2kskpt7a/metadata1.json";
  const tokenURI2 =
    "ipfs://bafybeigyod7ldrnytkzrw45gw2tjksdct6qaxnsc7jdihegpnk2kskpt7a/metadata2.json";
  const tokenURI3 =
    "ipfs://bafybeigyod7ldrnytkzrw45gw2tjksdct6qaxnsc7jdihegpnk2kskpt7a/metadata3.json";
  const tokenURI4 =
    "ipfs://bafybeigyod7ldrnytkzrw45gw2tjksdct6qaxnsc7jdihegpnk2kskpt7a/metadata4.json";

  const BaseERC721 = await ethers.getContractFactory("BaseERC721");
  const baseERC721 = await BaseERC721.deploy();
  await baseERC721.deployed();

  console.log(`Contract deployed to: https://goerli.etherscan.io/address/${baseERC721.address}`);

  // nftMintの第1引数はNFTオーナーとなるのでERC20のtransfer権限を持つものとする
  let tx = await baseERC721.nftMint(addr1, tokenURI1);
  await tx.wait();
  console.log("NFT#1 minted...");
  tx = await baseERC721.nftMint(addr1, tokenURI2);
  await tx.wait();
  console.log("NFT#2 minted...");
  tx = await baseERC721.nftMint(addr2, tokenURI3);
  await tx.wait();
  console.log("NFT#3 minted...");
  tx = await baseERC721.nftMint(addr2, tokenURI4);
  await tx.wait();
  console.log("NFT#4 minted...");

  fs.writeFileSync("./baseERC721Contract.ts",
    `module.exports = "${baseERC721.address}"`
  );
}

const baseERC721Deploy = async () => {
  try {
    await main();
    process.exit(0);
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
};

baseERC721Deploy();