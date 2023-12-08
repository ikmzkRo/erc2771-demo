const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BaseERC20 Contract", function () {
  const tokenURI1 = "honyohonyo1";
  const tokenURI2 = "honyohonyo2";
  const tokenURI3 = "honyohonyo3";
  const tokenURI4 = "honyohonyo4";
  const tokenURI5 = "honyohonyo5";
  let BaseERC20;
  let baseERC20;
  const name = "ZUTOMAYO";
  const symbol = "ZTMY";
  let owner;
  let addr1;
  let addr2;
  let addr3;
  let BaseERC721;
  let baseERC721;
  const zeroAddress = "0x0000000000000000000000000000000000000000";

  beforeEach(async function () {
    // Hardhat Networkのアカウントリストから順番に取得
    // https://note.com/standenglish/n/n87fc0df78133
    [owner, addr1, addr2, addr3] = await ethers.getSigners();
    BaseERC721 = await ethers.getContractFactory("BaseERC721");
    baseERC721 = await BaseERC721.deploy();
    await baseERC721.deployed();
    await baseERC721.nftMint(owner.address, tokenURI1);
    await baseERC721.nftMint(addr1.address, tokenURI2);
    await baseERC721.nftMint(addr1.address, tokenURI3);
    await baseERC721.nftMint(addr2.address, tokenURI4);
    BaseERC20 = await ethers.getContractFactory("BaseERC20");
    baseERC20 = await BaseERC20.deploy(name, symbol, baseERC721.address);
    await baseERC20.deployed();
  });
  describe("デプロイ", function () {
    it("トークンの名前とシンボルがセットされるべき", async function () {
      expect(await baseERC20.name()).to.equal(name);
      expect(await baseERC20.symbol()).to.equal(symbol);
    });
    it("デプロイアドレスがownerに設定されるべき", async function () {
      expect(await baseERC20.owner()).to.equal(owner.address);
    });
    it("ownerに総額が割り当てられるべき", async function () {
      const ownerBalance = await baseERC20.balanceOf(owner.address);
      expect(await baseERC20.totalSupply()).to.equal(ownerBalance);
    });
    it("預かっているTokenの総額が0であるべき", async function () {
      expect(await baseERC20.bankTotalDeposit()).to.equal(0);
    })
  });
  describe("アドレス間トランザクション", function () {
    beforeEach(async function () {
      await baseERC20.transfer(addr1.address, 500);
    });
    it("トークン移転がされるべき", async function () {
      const startAddr1Balance = await baseERC20.balanceOf(addr1.address);
      const startAddr2Balance = await baseERC20.balanceOf(addr2.address);

      await baseERC20.connect(addr1).transfer(addr2.address, 100);

      const endAddr1Balance = await baseERC20.balanceOf(addr1.address);
      const endAddr2Balance = await baseERC20.balanceOf(addr2.address);

      expect(endAddr1Balance).to.equal(startAddr1Balance.sub(100))
      expect(endAddr2Balance).to.equal(startAddr2Balance.add(100))
    });
    it("ゼロアドレス宛の移転は失敗すべき", async function () {
      await expect(baseERC20.transfer(zeroAddress, 100))
        .to.be.revertedWith("E:ZACBSFT");
    });
    it("残高不足の場合は移転に失敗すべき", async function () {
      await expect(baseERC20.connect(addr1).transfer(addr2.address, 510))
        .to.be.revertedWith("E:IB");
    });
    it("移転後には'TokenTransfer'イベントが発行されるべき", async function () {
      await expect(baseERC20.connect(addr1).transfer(addr2.address, 100))
        .emit(baseERC20, "TokenTransfer").withArgs(addr1.address, addr2.address, 100);
    });
  });
  describe("Bankトランザクション", function () {
    beforeEach(async function () {
      await baseERC20.transfer(addr1.address, 500);
      await baseERC20.transfer(addr2.address, 200);
      await baseERC20.transfer(addr3.address, 100);
      await baseERC20.connect(addr1).deposit(100);
      await baseERC20.connect(addr2).deposit(200);
    });
    it("トークン預入が実行できるべき", async function () {
      const addr1Balance = await baseERC20.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(400);
      const addr1bankBalance = await baseERC20.bankBalanceOf(addr1.address);
      expect(addr1bankBalance).to.equal(100);
    });
    it("預入後にもトークンを移転できるべき", async function () {
      const startAddr1Balance = await baseERC20.balanceOf(addr1.address);
      const startAddr2Balance = await baseERC20.balanceOf(addr2.address);

      await baseERC20.connect(addr1).transfer(addr2.address, 100);

      const endAddr1Balance = await baseERC20.balanceOf(addr1.address);
      const endAddr2Balance = await baseERC20.balanceOf(addr2.address);

      expect(endAddr1Balance).to.equal(startAddr1Balance.sub(100))
      expect(endAddr2Balance).to.equal(startAddr2Balance.add(100))
    });
    it("預入後には'TokenDeposit'イベントが発行されるべき", async function () {
      await expect(baseERC20.connect(addr1).deposit(100))
        .emit(baseERC20, "TokenDeposit").withArgs(addr1.address, 100);
    });
    it("トークン引き出しが実行できるべき", async function () {
      const startBankBalance = await baseERC20.connect(addr1).bankBalanceOf(addr1.address);
      const startTotalBankBalance = await baseERC20.connect(addr1).bankTotalDeposit();

      await baseERC20.connect(addr1).withdraw(100);

      const endBankBalance = await baseERC20.connect(addr1).bankBalanceOf(addr1.address);
      const endTotalBankBalance = await baseERC20.connect(addr1).bankTotalDeposit();

      expect(endBankBalance).to.equal(startBankBalance.sub(100));
      expect(endTotalBankBalance).to.equal(startTotalBankBalance.sub(100));
    });
    it("預入トークンが不足していた場合、引き出しに失敗すべき", async function () {
      await expect(baseERC20.connect(addr1).withdraw(101))
        .to.be.revertedWith("An amount greater than your tokenBank balance!");
    });
    it("引き出し後には'TokenWithdraw'イベントが発行されるべき", async function () {
      await expect(baseERC20.connect(addr1).withdraw(100))
        .emit(baseERC20, "TokenWithdraw").withArgs(addr1.address, 100);
    });
    it("オーナーによる預入は失敗すべき", async function () {
      await expect(baseERC20.deposit(1))
        .to.be.revertedWith("Owner cannot execute");
    });
    it("オーナーによる引出は失敗すべき", async function () {
      await expect(baseERC20.withdraw(1))
        .to.be.revertedWith("Owner cannot execute");
    });
    it("トータル預入トークン数より大きな数はオーナーであっても移転に失敗すべき", async function () {
      await expect(baseERC20.transfer(addr1.address, 201))
        .to.be.revertedWith("Amounts greater than the total supply cannot be transferred");
    });
    it("NFTメンバー以外の移転は失敗すべき", async function () {
      await expect(baseERC20.connect(addr3).transfer(addr1.address, 100))
        .to.be.revertedWith("not NFT member");
    });
    it("NFTメンバー以外の預入は失敗すべき", async function () {
      await expect(baseERC20.connect(addr3).deposit(1))
        .to.be.revertedWith("not NFT member");
    });
    it("NFTメンバー以外の引出は失敗すべき", async function () {
      await expect(baseERC20.connect(addr3).withdraw(1))
        .to.be.revertedWith("not NFT member");
    });
  });
});