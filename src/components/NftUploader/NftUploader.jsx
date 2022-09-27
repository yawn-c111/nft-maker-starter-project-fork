// NftUploader.jsx
import { ethers } from "ethers";
import Web3Mint from "../../utils/Web3Mint.json";
import { Button } from "@mui/material";
import React from "react";
import { useEffect, useState } from 'react'
import ImageLogo from "./image.svg";
import "./NftUploader.css";
import { Web3Storage } from 'web3.storage'

const NftUploader = () => {

  const CONTRACT_ADDRESS =
  "0x025e5fEf34DDF4DFb49EB2e2A51C6B65675De502";

  const [currentAccount, setCurrentAccount] = useState("");
  const [web3MintContract, setWeb3MintContract] = useState(null);
  const [remainingNFTs, setRemainingNFTs] = useState("");
  const [message, setMessage] = useState("If you choose image, you can mint your NFT");

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

  const renderNotConnectedContainer = () => (
      <button onClick={connectWallet} className="cta-button connect-wallet-button">
        Connect to Wallet
      </button>
  );

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

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
        <input className="nftUploadInput" multiple name="imageURL" type="file" accept=".jpg , .jpeg , .png" onChange={()=>alert()}  />
      </div>
      <p>または</p>
      <Button variant="contained">
        ファイルを選択
        <input className="nftUploadInput" type="file" accept=".jpg , .jpeg , .png" onChange={()=>alert()} />
      </Button>
    </div>
  );
};

export default NftUploader;