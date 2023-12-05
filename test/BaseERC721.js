const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BaseERC721コントラクト", function () {
  // コントラクト情報
  const name = "BaseERC721Name";
  const symbol = "BaseERC721Symbol";
  let BaseERC721;
  let baseERC721;

  // hardhat標準装備の試験用アドレスを取得する
  let contractDeployOwner;
  let mintToAddress;

  // テストに用いるメタデータ
  const metadataUrl_1 = 'https://mitanfire.com/json/1'
  const metadataUrl_2 = 'https://mitanfire.com/json/2'

  beforeEach(async function () {
    // デプロイセット
    [contractDeployOwner, mintToAddress, mintTestOwnerAddress] = await ethers.getSigners();
    BaseERC721 = await ethers.getContractFactory("BaseERC721"); // 新しいスマコンをデプロイするための関数、引数はコントラクト名
    baseERC721 = await BaseERC721.deploy(); // 実際にデプロイする
    await baseERC721.deployed(); // デプロイが終わるまで待機する
  })

  it("トークンの名前とシンボルがセットされるべき", async function () {
    expect(await baseERC721.name()).to.equal(name)
    expect(await baseERC721.symbol()).to.equal(symbol)
  });
  it("デプロイアドレスがownerに設定されるべき", async function () {
    expect(await baseERC721.owner()).to.equal(contractDeployOwner.address)
  });
  it("ownerはNFT作成できるべき", async function () {
    await baseERC721.nftMint(mintToAddress.address, metadataUrl_1)
    expect(await baseERC721.ownerOf(1)).to.equal(mintToAddress.address)
  });
  it("NFT作成のたびにtokenIdがインクリメントされるべき", async function () {
    await baseERC721.nftMint(mintToAddress.address, metadataUrl_1)
    expect(await baseERC721.tokenURI(1)).to.equal(metadataUrl_1)
    await baseERC721.nftMint(mintToAddress.address, metadataUrl_2)
    expect(await baseERC721.tokenURI(2)).to.equal(metadataUrl_2)
  });
  it("owner以外はNFT作成に失敗すべき", async function () {
    await expect(baseERC721.connect(mintTestOwnerAddress).nftMint(mintToAddress.address, metadataUrl_1))
      .to.be.revertedWith("Ownable: caller is not the owner"); // owner以外はNFT作成に失敗すべき
  });
  it("NFT作成後に'TokenURIChanged'イベントが発行されるべき", async function () {
    await expect(baseERC721.nftMint(mintToAddress.address, metadataUrl_1))
      .to.emit(baseERC721, "TokenURIChanged") // NFT作成後に'TokenURIChanged'イベントが発行されるべき
      .withArgs(mintToAddress.address, 1, metadataUrl_1) // 特定の引数でメソッドが呼ばれたかをチェック
  })
})