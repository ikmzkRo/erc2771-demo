// TODO: CSVに出力する関数を記載していく
// TODO: jupyternotebookでCSVを読み込みグラフ化して比較する
// TODO: Zennのartickleに転載して更新

import { expect } from 'chai';
import chai from "chai";
import { ethers } from "hardhat";
import Web3 from 'web3';
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import chaiAsPromised from 'chai-as-promised';

// chai-as-promised 拡張を使用可能にする
chai.use(chaiAsPromised);

describe("GasOfNFTBulkMint", () => {
  const DEFAULT_ADMIN_ROLE: string = '0x0000000000000000000000000000000000000000000000000000000000000000';
  const MINTER_ROLE: string | null = Web3.utils.soliditySha3("MINTER_ROLE");
  const EXECUTOR_ROLE: string | null = Web3.utils.soliditySha3("EXECUTOR_ROLE");
  const name: string = 'GasOfNFTBulkMint';
  const symbol: string = 'TEST';
  const baseTokenURI: string = 'https://example.com/';

  let GasOfNFTBulkMint: any;
  let gasOfNFTBulkMint: Contract;
  let deployer: SignerWithAddress;
  let executor: SignerWithAddress;
  let admin: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let minter: SignerWithAddress;
  let trustedForwarder: SignerWithAddress;

  // Count num
  const numString = process.env.TOS_LENGTH;
  const num = numString ? parseInt(numString, 10) || 2 : 2;

  // 

  beforeEach(async () => {
    [deployer, executor, admin, alice, bob, minter, trustedForwarder] = await ethers.getSigners();

    // deploy gasOfNFTBulkMint
    GasOfNFTBulkMint = await ethers.getContractFactory('GasOfNFTBulkMint');
    gasOfNFTBulkMint = await GasOfNFTBulkMint.deploy(
      name,
      symbol,
      baseTokenURI,
      admin.address,
      trustedForwarder.address
    );
    await gasOfNFTBulkMint.deployed();
  })

  describe("deploy check", () => {
    it("Should return default value", async () => {
      expect(await gasOfNFTBulkMint.hasRole(DEFAULT_ADMIN_ROLE, admin.address))
        .to.equal(true);
      expect(await gasOfNFTBulkMint.hasRole(EXECUTOR_ROLE, admin.address))
        .to.equal(true);
      expect(await gasOfNFTBulkMint.hasRole(MINTER_ROLE, admin.address))
        .to.equal(true);

      expect(await gasOfNFTBulkMint.totalSupply()).to.equal(0);
    })

    it('should deploy gasOfNFTBulkMint contract', async () => {
      expect(gasOfNFTBulkMint.address).to.not.equal('');
    });

    it('should set the deployer as the DEFAULT_ADMIN_ROLE', async () => {
      const isAdmin = await gasOfNFTBulkMint.hasRole(DEFAULT_ADMIN_ROLE, deployer.address);
      expect(isAdmin).to.be.false;
    });
  })

  describe("bulk mint - require once", function () {
    it("[S] Should bulkMint when called by minter", async function () {
      // check alice recipient
      const tos = Array(num).fill(alice.address);
      await gasOfNFTBulkMint.connect(admin).BulkMint_RequireOnce(tos);

      expect(await gasOfNFTBulkMint.balanceOf(alice.address)).to.equal(num);
      expect(await gasOfNFTBulkMint.ownerOf(1)).to.equal(alice.address);
      expect(await gasOfNFTBulkMint.ownerOf(2)).to.equal(alice.address);
      expect(await gasOfNFTBulkMint.tokenOfOwnerByIndex(alice.address, 0)).to.equal(1);
      expect(await gasOfNFTBulkMint.tokenOfOwnerByIndex(alice.address, 1)).to.equal(2);
    });
  })

  describe("bulk mint - require again", function () {
    it("[S] Should bulkMint when called by minter", async function () {
      // check alice recipient
      const tos = Array(num).fill(alice.address);
      await gasOfNFTBulkMint.connect(admin).BulkMint_RequireAgain(tos);

      expect(await gasOfNFTBulkMint.balanceOf(alice.address)).to.equal(num);
      expect(await gasOfNFTBulkMint.ownerOf(1)).to.equal(alice.address);
      expect(await gasOfNFTBulkMint.ownerOf(2)).to.equal(alice.address);
      expect(await gasOfNFTBulkMint.tokenOfOwnerByIndex(alice.address, 0)).to.equal(1);
      expect(await gasOfNFTBulkMint.tokenOfOwnerByIndex(alice.address, 1)).to.equal(2);
    });
  })

})
