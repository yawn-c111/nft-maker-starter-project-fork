// NftUploader.jsx
import { ethers } from "ethers";
import Web3Mint from "../../utils/Web3Mint.json";
import { Button } from "@mui/material";
import React from "react";
import { useEffect, useState } from 'react'
import ImageLogo from "./image.svg";
import "./NftUploader.css";
import { Web3Storage } from 'web3.storage'

const CONTRACT_ADDRESS =
  "0x025e5fEf34DDF4DFb49EB2e2A51C6B65675De502";

const NftUploader = () => {
  /*
   * ユーザーのウォレットアドレスを格納するために使用する状態変数を定義します。
   */
  const [currentAccount, setCurrentAccount] = useState("");
  const [web3MintContract, setWeb3MintContract] = useState(null);
  const [remainingNFTs, setRemainingNFTs] = useState("");
  const [message, setMessage] = useState("If you choose image, you can mint your NFT");

  /*この段階でcurrentAccountの中身は空*/
  console.log("currentAccount: ", currentAccount);
  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;
    if (!ethereum) {
      console.log("Make sure you have MetaMask!");
      return;
    } else {
      console.log("We have the ethereum object", ethereum);
    }

    const accounts = await ethereum.request({ method: "eth_accounts" });

    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account:", account);
      setCurrentAccount(account);

      let chainId = await ethereum.request({ method: "eth_chainId" });
      console.log("Connected to chain " + chainId);
      const goerliChainId = "0x5";
      if (chainId !== goerliChainId) {
        alert("You are not connected to the Goerli Test Network!");
      }

      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const connectedContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        Web3Mint.abi,
        signer
      );
      connectedContract !== web3MintContract && setWeb3MintContract(connectedContract);
      const _remainingNFTs = 50 - await connectedContract.readCurrentTokenId();
      _remainingNFTs !== remainingNFTs && setRemainingNFTs(_remainingNFTs);
      console.log("remaining NFTs:", _remainingNFTs);
    } else {
      console.log("No authorized account found");
    }
  };

  const connectWallet = async () =>{
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }
      /*
       * ウォレットアドレスに対してアクセスをリクエストしています。
       */
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      console.log("Connected", accounts[0]);
      /*
       * ウォレットアドレスを currentAccount に紐付けます。
       */
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  };

  const askContractToMintNft = async (ipfs) => {
    try {
      const { ethereum } = window;
      if (ethereum) {

        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          Web3Mint.abi,
          signer
        );
        console.log("Going to pop wallet now to pay gas...");
        let nftTxn = await connectedContract.mintIpfsNFT("sample",ipfs);
        let _message = "Mining...please wait.";
        console.log(_message);
        _message !== message && setMessage(_message);
        await nftTxn.wait();
        _message = "If you choose image, you can mint your NFT";
        setMessage(_message);
        console.log(
          `Mined, see transaction: https://goerli.etherscan.io/tx/${nftTxn.hash}`
        );

      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    let connectedContract;
  
    const onMintIpfsNFT = (_owner, _tokenId) => {
      console.log("MintIpfsNFT", _owner, _tokenId);
      const NFTs = _tokenId.toNumber();
      const _remainingNFTs = 50 - NFTs - 1;
      setRemainingNFTs(_remainingNFTs);
    };

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      connectedContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        Web3Mint.abi,
        signer
      );
      connectedContract.on("MintIpfsNFT", onMintIpfsNFT);
    }
    return () => {
      if (connectedContract) {
        connectedContract.off("MintIpfsNFT", onMintIpfsNFT);
      }
    };
  }, []);


  const renderNotConnectedContainer = () => (
      <button onClick={connectWallet} className="cta-button connect-wallet-button">
        Connect to Wallet
      </button>
    );
  /*
   * ページがロードされたときに useEffect()内の関数が呼び出されます。
   */
  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDE3ZDBCYzlEMTc3MkY3NDQ4MkE3QTQ4YTcyYjQ3MTg5NDBCMTcxQUYiLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2NjQxMDQ4NjM5NTEsIm5hbWUiOiJhcGlfa2V5In0.xRYBRvhVO_yoaBhB_mFNioIFCARNla65Db-4eJB9KWQ";

  const imageToNFT = async (e) => {
    const client = new Web3Storage({ token: API_KEY })
    const image = e.target
    console.log(image)

    const rootCid = await client.put(image.files, {
        name: 'experiment',
        maxRetries: 3
    })
    const res = await client.get(rootCid) // Web3Response
    console.log("res");
    const files = await res.files() // Web3File[]
    console.log("files");
    for (const file of files) {
      console.log("file.cid:",file.cid)
      askContractToMintNft(file.cid)
    }
  }

  return (
    <div className="outerBox">
      <p>残りNFT： {remainingNFTs} / 50</p>
      <Button variant="contained" href="https://testnets.opensea.io/collection/tanyanft-yosfwqzk4l">
        OpenSea でコレクションを表示
      </Button>
      {currentAccount === "" ? (
        renderNotConnectedContainer()
      ) : (
        <p>{message}</p>
      )}
      <div className="title">
        <h2>NFTアップローダー</h2>
      </div>
      <div className="nftUplodeBox">
        <div className="imageLogoAndText">
          <img src={ImageLogo} alt="imagelogo" />
          <p>ここにドラッグ＆ドロップしてね</p>
        </div>
        <input className="nftUploadInput" multiple name="imageURL" type="file" accept=".jpg , .jpeg , .png" onChange={imageToNFT}  />
      </div>
      <p>または</p>
      <Button variant="contained">
        ファイルを選択
        <input className="nftUploadInput" type="file" accept=".jpg , .jpeg , .png" onChange={imageToNFT} />
      </Button>
    </div>
  );
};

export default NftUploader;