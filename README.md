# hardhat init
NFTを所有した会員のみが地域通貨を配布できるような基本リポジトリです。

## this is only once　for local machine
- nvm をインストールする(nodeバージョン管理用) Link
- nvm use でプロジェクトで設定したnodeバージョンを利用する
- npm install --global yarn でyarnを利用する

## Run after project clone
- yarn で依存modulesをインストールする

## directry Structure
- directry構成のtreeをこちらに記述する
```

```
- Description of each contracts directory
- Description of each derectry of hardhat-init
- Description of each file of hardhat-init

## Command List
| Command | Explanation |
| ---- | ---- |
| `npx hardhat compile` | Explanation |
| `npx hardhat test test/BaseERC20.js` | Explanation |
| `npx hardhat node` |  |
| `npx hardhat run scripts/deploy.js --network localhost` |  |
| `npx hardhat run scripts/baseERC721Contract.js --network goerli` |  |
| `npx hardhat console --network localhost` | デプロイしたコントラクトに接続する |
|  |  |
|  |  |
|  |  |
|  |  |
|  |  |
|  |  |
|  |  |


## Code gideLine


## env


## Checklist for testing


## deploy & Upgrade Rule


# demo
## Deploying a smart contract on the localhost.
localhostにスマートコントラクトをデプロイする。
```
-- tab1
npx hardhat node

TP and WebSocket JSON-RPC server at http://127.0.0.1:8545/

Accounts
========

WARNING: These accounts, and their private keys, are publicly known.
Any funds sent to them on Mainnet or any other live network WILL BE LOST.

Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

-- tab2
npx hardhat run scripts/baseERC721Contract.js --network localhost
Contract deployed to: https://goerli.etherscan.io/address/0x5FC8d32690cc91D4c39d9d3abcBD16989F875707
NFT#1 minted...
NFT#2 minted...
NFT#3 minted...
NFT#4 minted...

or
npx hardhat run scripts/baseERC20Contract.js --network localhost
```

デプロイされたコントラクトアドレスが追記された./baseERC721Contract.jsを確認する。

## Connecting to a deployed smart contract
デプロイしたコントラクトに接続する
```
npx hardhat console --network localhost

Welcome to Node.js v18.16.1.
Type ".help" for more information.
> const address = "0x5fbdb2315678afecb367f032d93f642f64180aa3"
undefined
> const test = await ethers.getContractAt("BaseERC721", address);
undefined
> test
Contract {
  interface: Interface {
    fragments: [
      ..
    ]
  }
}
...
> await test.name()
'BaseERC721Name'
> await test.symbol()
'BaseERC721Symbol'
> await test.ownerOf(1)
'0x92757D6b4f7cffE24727E8Fa8Ab52fbdb77c303F'
> await test.tokenURI(1)
'ipfs://bafybeigyod7ldrnytkzrw45gw2tjksdct6qaxnsc7jdihegpnk2kskpt7a/metadata1.json'
```

## Deploying a smart contract on the testnetwork.
testnetworkにスマートコントラクトをデプロイする。

### ERC721
```
-- tab1
npx hardhat node

-- tab2
npx hardhat run scripts/baseERC721Contract.js --network goerli


npx hardhat verify --network goerli 0x3bccD924B40159aCD89decC5DB78B5baf425805b
Nothing to compile
Successfully submitted source code for contract
contracts/BaseERC721.sol:BaseERC721 at 0x3bccD924B40159aCD89decC5DB78B5baf425805b
for verification on the block explorer. Waiting for verification result...

Successfully verified contract BaseERC721 on Etherscan.
https://goerli.etherscan.io/address/0x3bccD924B40159aCD89decC5DB78B5baf425805b#code
```

### ERC20
```
-- tab1
npx hardhat node

-- tab2
npx hardhat run scripts/baseERC20Contract.js --network goerli
baseERC721ContractAddress 0x3bccD924B40159aCD89decC5DB78B5baf425805b
Contract deployed to: https://goerli.etherscan.io/address/0x93A6bE70077B840a2A56BcAc8A5fac6C15F38F25
transferred to addr2
transferred to addr3
transferred to addr4

npx hardhat verify --constructor-args argument.ts --network goerli 0x93A6bE70077B840a2A56BcAc8A5fac6C15F38F25
Nothing to compile
Successfully submitted source code for contract
contracts/BaseERC20.sol:BaseERC20 at 0x93A6bE70077B840a2A56BcAc8A5fac6C15F38F25
for verification on the block explorer. Waiting for verification result...

Successfully verified contract BaseERC20 on Etherscan.
https://goerli.etherscan.io/address/0x93A6bE70077B840a2A56BcAc8A5fac6C15F38F25#code
```

## debug && bug report
- ERC20のtoken名は11文字以下である必要がある
- error: ProviderError: execution reverted: not NFT member