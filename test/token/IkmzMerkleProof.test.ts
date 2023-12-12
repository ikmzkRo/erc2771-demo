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
    // コントラクトが AllowList にあるかどうかを計算
    hexProof = merkleTree.getHexProof(keccak256(allowListedUser.address));
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

  it("[S} The owner should be able to create NFTs.", async function () {
    await ikmzMerkleProof.mint(to.address)
    expect(await ikmzMerkleProof.ownerOf(1)).to.equal(to.address)
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
    await ikmzMerkleProof.connect(allowListedUser).mint(hexProof);
  });

  it("[S] mint by notListedUserAddress", async function () {
    await expect(ikmzMerkleProof.connect(notListedUser).mint(hexProof)).to.be.revertedWith(
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