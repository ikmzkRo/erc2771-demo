const fs = require("fs");
const baseERC721ContractAddress = require("../baseERC721Contract");
console.log(`baseERC721ContractAddress`, baseERC721ContractAddress);

const main = async () => {
  const addr1 = "0xD5Df8975d40bd92e8EA2A2CE5068D11B1C3dB1f7";
  const addr2 = "0xE1F1A9cE89AB46E416712Fc5c17aFaEF38e84680";
  const addr3 = "0x7De27aF7b7bdc011965BC11a690e855bC97915C2";
  const addr4 = "0x431f1519b7cCB412Bd034a76899D9Ab5f4628EC6";

  const BaseERC20 = await ethers.getContractFactory("BaseERC20");
  const baseERC20 = await BaseERC20.deploy("ZUTOMAYO", "ZTMY", baseERC721ContractAddress);
  await baseERC20.deployed();
  console.log(`Contract deployed to: https://goerli.etherscan.io/address/${baseERC20.address}`);

  let tx = await baseERC20.transfer(addr2, 300);
  await tx.wait();
  console.log("transferred to addr2");
  tx = await baseERC20.transfer(addr3, 200);
  await tx.wait();
  console.log("transferred to addr3");
  tx = await baseERC20.transfer(addr4, 100);
  await tx.wait();
  console.log("transferred to addr4");

  // Verifyで読み込むargument.tsを生成
  fs.writeFileSync("./argument.ts",
    `module.exports = [
  "ZUTOMAYO",
  "ZTMY",
  "${baseERC721ContractAddress}"
]
    `
  );

  // フロントエンドアプリが読み込むcontracts.tsを生成
  fs.writeFileSync("./contracts.ts",
    `export const baseERC721ContractAddress = "${baseERC721ContractAddress}"
export const baseERC20ContractAddress = "${baseERC20.address}"`
  );
}

const baseERC20Deploy = async () => {
  try {
    await main();
    process.exit(0);
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
};

baseERC20Deploy();