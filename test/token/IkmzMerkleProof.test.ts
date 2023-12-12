const { expect } = require("chai");
const { ethers } = require("hardhat");
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("IkmzMerkleProof", function () {
  const name = "testName";
  const symbol = "testSymbol";
  let IkmzMerkleProof: any;
  let ikmzMerkleProof: Contract;
  let owner: SignerWithAddress;
  let to: SignerWithAddress;

  beforeEach(async function () {
    [owner, to] = await ethers.getSigners();
    IkmzMerkleProof = await ethers.getContractFactory("IkmzMerkleProof");
    ikmzMerkleProof = await IkmzMerkleProof.deploy(name, symbol);
    await ikmzMerkleProof.deployed();
  })

  it("[S] The deployment address should be set as the owner.", async function () {
    expect(await ikmzMerkleProof.owner()).to.equal(owner.address)
  });

  it("[S} The owner should be able to create NFTs.", async function () {
    await ikmzMerkleProof.mint(to.address)
    expect(await ikmzMerkleProof.ownerOf(1)).to.equal(to.address)
  });
});