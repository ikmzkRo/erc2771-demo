const { expect } = require("chai");
const { ethers } = require("hardhat");
import { Contract } from "ethers";
import chai from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import ChaiAsPromised from "chai-as-promised";
import keccak256 from "keccak256";
import { MerkleTree } from "merkletreejs";
// TODO: typechain install
// import type { IkmzMerkleProof } from "../typechain-types";

// 通常、Chaiは同期的なテストのために使用されますが、Ethereumのスマートコントラクトのテストのように非同期な処理を含む場合、ChaiAsPromised プラグインが役立ちます。
chai.use(ChaiAsPromised);

describe("IkmzMerkleProof", async function () {
  const name = "testName";
  const symbol = "testSymbol";
  let IkmzMerkleProof: any;
  let ikmzMerkleProof: Contract;
  let owner: SignerWithAddress;
  let to: SignerWithAddress;
  let allowListedUser: SignerWithAddress;
  let notListedUser: SignerWithAddress;
  // hexProofは、特定のアドレスがMerkleツリーの"許可リスト"に含まれているかどうかを示すために使用されます
  let hexProof: string[];
  let rootHash: Buffer;

  beforeEach(async function () {
    [owner, to, allowListedUser, notListedUser] = await ethers.getSigners();
    IkmzMerkleProof = await ethers.getContractFactory("IkmzMerkleProof");
    ikmzMerkleProof = await IkmzMerkleProof.deploy(name, symbol);
    await ikmzMerkleProof.deployed();

    // マークルツリーを構築します
    // TODO: アドレス個別に発行する数を指定してみる
    const allowList = [allowListedUser.address];
    const merkleTree = new MerkleTree(allowList.map(keccak256), keccak256, {
      sortPairs: true,
    });

    // allowListedUser.addressのアドレスのKeccak-256ハッシュ（通常はSHA-3とも呼ばれる）を計算
    // Keccak-256は一方向の暗号ハッシュ関数で、ユニークな入力に対して一意のハッシュ値を生成します
    // Merkleツリーにおいて、指定されたアドレスのハッシュに対するMerkle Proofを取得します。
    // Merkle Proofは、ツリーのルートから対象のノードまでのパスを示す情報で、対象がツリー内に存在することを検証するのに使用されます
    // このhexProofは、後でmint関数を呼ぶ際に、allowList（許可リスト）に含まれるアドレスであることを検証するために使用されます
    // このhexProofを受け取り、Merkle Proofを検証して、アドレスが許可リストに含まれている場合にNFTを発行するかどうかを判断します
    const hashedList = keccak256(allowListedUser.address)
    const hexProof = merkleTree.getHexProof(keccak256(allowListedUser.address));

    // TODO: hexProof が空配列で返却されてしまう
    console.log('hexProof', hexProof);

    // ツリーの最上を算出
    rootHash = merkleTree.getRoot();

    // コントラクトにマークルルートを登録する
    await ikmzMerkleProof
      .connect(owner)
      .setMerkleRoot(`0x${rootHash.toString("hex")}`);
  })
  console.log('(; ･`д･´)')

  it("[S] The deployment address should be set as the owner.", async function () {
    expect(await ikmzMerkleProof.owner()).to.equal(owner.address)
  });

  // setMerkleRoot は owner のみ設定可能
  it("[S] The test for setMerkleRoot being onlyOwner.", async function () {
    await expect(
      ikmzMerkleProof
        .connect(notListedUser)
        .setMerkleRoot(`0x${rootHash.toString("hex")}`)
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("[S] Check the current balance", async function () {
    expect(await ikmzMerkleProof.balanceOf(allowListedUser.address)).to.be.equal(
      BigInt(0)
    );
    expect(await ikmzMerkleProof.balanceOf(notListedUser.address)).to.be.equal(
      BigInt(0)
    );
  });

  it("[S] mint by allowListedUserAddress", async function () {
    await ikmzMerkleProof.connect(allowListedUser).mint(to, hexProof);
  });

  it("[S] mint by notListedUserAddress", async function () {
    await expect(ikmzMerkleProof.connect(notListedUser).mint(to, hexProof)).to.be.revertedWith(
      "Invalid proof"
    );
  });

  it("[S] Check the current balance", async function () {
    expect(await ikmzMerkleProof.balanceOf(allowListedUser.address)).to.be.equal(
      BigInt(1)
    );
    expect(await ikmzMerkleProof.balanceOf(notListedUser.address)).to.be.equal(BigInt(0));
  });
});