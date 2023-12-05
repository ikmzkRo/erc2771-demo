const main = async () => {
  Test = await ethers.getContractFactory("BaseERC20");
  test = await Test.deploy();
  await test.deployed();

  console.log(`Contract deployed to: ${test.address}`);
  console.log(`Contract deployed info details: ${test}`);
}

const deploy = async () => {
  try {
    await main();
    process.exit(0);
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
};

deploy()