import Head from 'next/head'
import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import axios from 'axios'
import { baseERC20ContractAddress, baseERC721ContractAddress } from '../../contracts'
import BaseERC721 from '../contracts/BaseERC721.json'
import BaseERC20 from '../contracts/BaseERC20.json'
// https://nextjs.org/docs/api-reference/next/image
import Image from 'next/image'

// https://blog.tanebox.com/archives/1757/
interface Window {
  ethereum: any
}
declare var window: Window

export default function Home() {
  const [account, setAccount] = useState('')
  const [chainId, setChainId] = useState(false)
  const [tokenBalance, setTokenBalance] = useState('')
  const [bankBalance, setBankBalance] = useState('')
  const [bankTotalDeposit, setBankTotalDeposit] = useState('')
  const [nftOwner, setNftOwner] = useState(false)
  const [inputData, setInputData] = useState({ transferAddress: '', transferAmount: '', depositAmount: '', withdrawAmount: '' });
  const [items, setItems] = useState<any[]>([])
  const goerliId = '0x5'
  const zeroAddress = "0x0000000000000000000000000000000000000000";
  
  const checkMetaMaskInstalled = async () => {
    const { ethereum } = window;
    if (!ethereum) {
      alert('MetaMaskをインストールしてください！');
    }
  }

  const checkChainId = async () => {
    const { ethereum } = window;
    if (ethereum) {
      const chain = await ethereum.request({
        method: 'eth_chainId'
      });
      console.log(`chain: ${chain}`);

      if (chain != goerliId) {
        alert('Goerliに接続してください');
        setChainId(false)
        return
      } else {
        setChainId(true)
      }
    }
  }

  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      const accounts = await ethereum.request({
        method: 'eth_requestAccounts'
      });
      console.log(`account: ${accounts[0]}`)
      setAccount(accounts[0])

      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const erc20Contract = new ethers.Contract(baseERC20ContractAddress, BaseERC20.abi, signer);
      const tBalance = await erc20Contract.balanceOf(accounts[0]);
      console.log(`tBalance: ${tBalance}`);
      setTokenBalance(tBalance.toNumber());

      const bBalance = await erc20Contract.bankBalanceOf(accounts[0]);
      console.log(`bBalance: ${bBalance}`);
      setBankBalance(bBalance.toNumber());

      const totalDeposit = await erc20Contract.bankTotalDeposit();
      console.log(`totalDeposit: ${totalDeposit}`);
      setBankTotalDeposit(totalDeposit.toNumber());

      checkNft(accounts[0]);

      ethereum.on('accountsChanged', checkAccountChanged);
      ethereum.on('chainChanged', checkChainId);
    } catch (err) {
      console.log(err)
    }
  }

  const checkAccountChanged = () => {
    setAccount('');
    setNftOwner(false);
    setItems([]);
    setTokenBalance('');
    setBankBalance('');
    setBankTotalDeposit('');
    setInputData({ transferAddress: '', transferAmount: '', depositAmount: '', withdrawAmount: '' });
  }

  const checkNft = async (addr: string) => {
    const { ethereum } = window;
    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();
    const nftContract = new ethers.Contract(baseERC721ContractAddress, BaseERC721.abi, signer);
    const balance = await nftContract.balanceOf(addr);
    console.log(`nftBalance: ${balance.toNumber()}`);

    if (balance.toNumber() > 0) {
      setNftOwner(true);
      for (let i = 0; i < balance.toNumber(); i++) {
        const tokenId = await nftContract.tokenOfOwnerByIndex(addr, i);
        let tokenURI = await nftContract.tokenURI(tokenId);
        tokenURI = tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/');
        const meta = await axios.get(tokenURI);

        const name = meta.data.name;
        const description = meta.data.description;
        const imageURI = meta.data.image.replace('ipfs://', 'https://ipfs.io/ipfs/');

        const item: any = {
          tokenId,
          name,
          description,
          tokenURI,
          imageURI
        }
        setItems(items => [...items, item]);
      }
    } else { '' }
  }

  const tokenTransfer = async (event: any) => {
    event.preventDefault();
    if (tokenBalance >= inputData.transferAmount && zeroAddress != inputData.transferAddress) {
      try{
        const { ethereum } = window;
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const erc20Contract = new ethers.Contract(baseERC20ContractAddress, BaseERC20.abi, signer);
        const tx = await erc20Contract.transfer(inputData.transferAddress, inputData.transferAmount);
        await tx.wait();

        const tBalance = await erc20Contract.balanceOf(account);
        setTokenBalance(tBalance.toNumber());
        setInputData(prevData => ({
          ...prevData,
          transferAddress: '',
          transferAmount: ''
        }));
      } catch (err) {
        console.log(err);
      }
    } else {
      alert("所持残高を超えるトークン及びゼロアドレス宛は指定できません")
    }
  }
  
  const tokenDeposit = async (event: any) => {
    event.preventDefault();
    if (tokenBalance >= inputData.depositAmount) {
      try{
        const { ethereum } = window;
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const erc20Contract = new ethers.Contract(baseERC20ContractAddress, BaseERC20.abi, signer);
        const tx = await erc20Contract.deposit(inputData.depositAmount);
        await tx.wait();

        const tBalance = await erc20Contract.balanceOf(account);
        const bBalance = await erc20Contract.bankBalanceOf(account);
        const totalDeposit = await erc20Contract.bankTotalDeposit();
        setTokenBalance(tBalance.toNumber());
        setBankBalance(bBalance.toNumber());
        setBankTotalDeposit(totalDeposit.toNumber());
          
        setInputData(prevData => ({
          ...prevData,
          depositAmount: ''
        }));
      } catch (err) {
        console.log(err);
      }
    } else {
      alert("所持残高を超えるトークン預入できません")
    }
  }

  const tokenWithdraw = async (event: any) => {
    event.preventDefault();
    if (bankBalance >= inputData.withdrawAmount) {
      try{
        const { ethereum } = window;
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const erc20Contract = new ethers.Contract(baseERC20ContractAddress, BaseERC20.abi, signer);
        const tx = await erc20Contract.withdraw(inputData.withdrawAmount);
        await tx.wait();

        const tBalance = await erc20Contract.balanceOf(account);
        const bBalance = await erc20Contract.bankBalanceOf(account);
        const totalDeposit = await erc20Contract.bankTotalDeposit();
        setTokenBalance(tBalance.toNumber());
        setBankBalance(bBalance.toNumber());
        setBankTotalDeposit(totalDeposit.toNumber());
        setInputData(prevData => ({
          ...prevData,
          withdrawAmount: ''
        }));
      } catch (err) {
        console.log(err);
      }
    } else {
      alert("預入残高を超えるトークンは引出できません")
    }
  }

  const handler = (e: any) => {
    setInputData(prevData => ({
      ...prevData,
      [e.target.name]: e.target.value
    }));
  }

  useEffect(() => {
    checkMetaMaskInstalled()
    checkChainId()
  }, [])

  return (
    <div className={'flex flex-col items-center bg-slate-100 text-blue-900 min-h-screen'}>
      <h2 className={'text-6xl font-bold my-12 mt-8'}>
        Hello World!
      </h2>
      <div className={'flex mt-1'}>
        {account === '' ? (
          <button className={'bg-transparent text-blue-700 font-semibold py-2 px-4 border border-blue-500 rounded hover:border-transparent hover:text-white hover:bg-blue-500 hover:cursor-pointer'}
          onClick={connectWallet}>
            MetaMaskを接続
          </button>          
        ) : (
          chainId ? (
            <div >
              <div className='px-2 py-2 bg-transparent'>
                <span className="flex flex-col items-left font-semibold">総預かり残高：{bankTotalDeposit}</span>
              </div>
              <div className='px-2 py-2 mb-2 bg-white border border-gray-400'>
                <span className="flex flex-col items-left font-semibold">アドレス：{account}</span>
                <span className="flex flex-col items-left font-semibold">所持残高：{tokenBalance}</span>
                < span className="flex flex-col items-left font-semibold">預入残高：{bankBalance}</span>
              </div>
              {nftOwner ? (
              <>
                <form className="flex pl-1 py-1 mb-1 bg-white border border-gray-400">
                  <input
                    type="text"
                    className="w-5/12 ml-2 text-center border border-gray-400"
                    name="transferAddress"
                    placeholder="Wallet Address"
                    onChange={handler}
                    value={inputData.transferAddress}
                  />
                  <input
                    type="text"
                    className="w-5/12 ml-2 text-right border border-gray-400"
                    name="transferAmount"
                    placeholder={`100`}
                    onChange={handler}
                    value={inputData.transferAmount}
                  />
                  <button
                    className="w-2/12 mx-2 bg-white border-blue-500 hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-1 px-2 border border-blue-500 hover:border-transparent rounded"
                    onClick={tokenTransfer}
                  >移転</button>
                </form>
                <form className="flex pl-1 py-1 mb-1 bg-white border border-gray-400">
                  <input
                    type="text"
                    className="w-10/12 ml-2 text-right border border-gray-400"
                    name="depositAmount"
                    placeholder={`100`}
                    onChange={handler}
                    value={inputData.depositAmount}
                  />
                  <button
                    className="w-2/12 mx-2 bg-white hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-1 px-2 border border-blue-500 hover:border-transparent rounded"
                    onClick={tokenDeposit}
                  >預入</button>
                </form>
                <form className="flex pl-1 py-1 mb-1 bg-white border border-gray-400">
                  <input
                    type="text"
                    className="w-10/12 ml-2 text-right border border-gray-400"
                    name="withdrawAmount"
                    placeholder={`100`}
                    onChange={handler}
                    value={inputData.withdrawAmount}
                  />
                  <button
                    className="w-2/12 mx-2 bg-white hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-1 px-2 border border-blue-500 hover:border-transparent rounded"
                    onClick={tokenWithdraw}
                  >引出</button>
                </form>
                {
                  items.map((item: any, i: any) => (
                    <div key={i} className="flex justify-center pl-1 py-2 mb-1">
                      <div className="flex flex-col md:flex-row md:max-w-xl rounded-lg bg-white shadow-lg">
                        <Image className=" w-full h-96 md:h-auto object-cover md:w-48 rounded-t-lg md:rounded-none md:rounded-l-lg" src={item.imageURI} alt="" />
                        <div className="p-6 flex flex-col justify-start">
                          <h5 className="text-gray-900 text-xl font-medium mb-2">{item.name}</h5>
                          <p className="text-gray-700 text-base mb-4">
                            {item.description}
                          </p>
                          <p className="text-gray-600 text-xs">所有NFT# {item.tokenId.toNumber()}</p>
                        </div>
                      </div>
                    </div>
                  ))
                }                            
              </>) : (<></>)}
            </div>
          ) : (
            <div className='flex flex-col justify-center items-center mb-20 font-bold text-2xl gap-y-3'>
              <div>Goerliに接続してください</div>
            </div>)          
        )}
      </div>
    </div>
  )
}