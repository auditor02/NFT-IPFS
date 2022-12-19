import { Contract, providers, utils } from "ethers";
import Head from 'next/head'
import { useEffect, useRef, useState } from "react";
import web3Modal from "web3modal";
import { abi, NFT_CONTRACT_ADDRESS } from "../contacts";
import styles from '../styles/Home.module.css';

export default function Home() {
  // walletConnected keep track of whether the user's wallet is connected or not
  const [walletConnected, setWalletConnected] = useState(false); 
  // Loading is set to true when we are waiting for a transaction to get minted
  const [loading, setLoading] = useState(false);

  // tokenIdMinted keeps track of the number of tokenIds that have been minted
  const [tokenIdMinted, setTokenIdsMinted] = useState("0");
  //  Create a reference to the web3 Modal (used for connecting to Metamask ) which persists asz long as the page is open
  const web3ModalRef = useRef();

  /**
   * publicMint: Mint an NFT
   */
  const publicMint = async () => {
    try {
      console.log("Public Mint");
      // We need a Signer here since this is a `write` transaction.
      const signer = await getProviderOrSigner(true);
      // Create a new instance of the Contract with a Signer, which allows update methods
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);
      // call the mint from the contract to mint the LW3Punks
      const tx = await nftContract.mint({
        // value signifies the cost of one LW3Punks which is "0.01 eth"
        // We are parsing "0.01" string to ether using the utils library from ethers.js
        value: utils.parseEther("0.01"),
      });
      setLoading(true);
      // wait for the transaction to get mined
      await tx.wait();
      setLoading(false);
      window.alert("You successfully minted a LW3Punk!");
    } catch (err) {
      console.error(err)
    }
  };

  /**
   * connectWallet: Connects the meatmask wallet
   */
  const connectWallet = async () => {
    try {
      // Get the provider from web3Modal, which in our case is Metamask
      // When used for the first time, it prompts the user to connect their wallet
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (err) {
      console.error(err);
    } 
  };

  /**
   * getTokenIdsMinted gets the number of tokenIds that have been minted
   */
  const getTokenIdsMinted = async () => {
    try {
      // Get the provider from web3Modal, which in our case is Metamask
      // No need for the Signer here, as we are only reading state from the blockchain
      const provider = await getProviderOrSigner();
      // We connect to the contract using a Provider, so we will only have read-only access to the Contract
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      // call the tokenIds from the contract
      const _tokenIds = await nftContract.tokenIds();
      console.log("tokenIds", _tokenIds);
      // _tokenIds is a `Big Number`. We need to convert the Big Number to a string
      setTokenIdsMinted(_tokenIds.toString())  
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * Returns a Provider or Signer object Representing the Ethereum RPC with or without the
   * signing capabilities of metamask attached
   * 
   * A `Provider`is needed to interact with the blockchain - reading transactions, reading balances, reading state, etc.
   *  
   * A `Signer` is a special type of Provider used in case a `write` transaction needs to be made to the blockchain, which involves the connected account
   * needing to make a digital signature to authorize the transaction being sent. Metamask exposes a Signer API to allow your website to 
   * request signatures from the user using Signer functions.
   * 
   * @param [*] needSigner - True If you need the signer, default false otherwise
   */
  const getProviderOrSigner = async (needSigner = false) => {
    // Connect to MetaMask
    // Since we store `web3Modal` as a reference, we need to access the  `current` value to get access to te underlying object
    const provider = await web3ModalRef.current();
    const web3Provider = new providers.web3Provider(provider);

    // If user is not connected to the Mumbai network, let them know and throw an error
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 80001) {
      window.alert("Change the network to Mumbai");
      throw new Error("Change network to Mumbai");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
      return web3Provider;
  };

  //  useEffects are used to react to changes in state of the website
  // The array at the end of function call represents what state changes will trigger this effect
  // On this case, whenever the value of `walletConnected` changes - This \effect will be called
  useEffect(() => {
    // If wallet is not connected, create a new instance of Web3Modal and connect the MetaMask wallet
    if (!walletConnected) {
      // Assigne the web3Modal class to the reference object by setting it's `current` value
      // The `current` value is persisted throughout as long as this page is open
      web3ModalRef.current = new web3Modal({
        network: "mumbai",
        providerOptions: {},
        disableInjectedProvider: false,
      });

      connectWallet();

      getTokenIdsMinted();

      // Set an interval to get the nuber of token Ids minted every 5 seconss
      setInterval(async function () {
        await getTokenIdsMinted();
      }, 5 * 1000);
    }
  }, [walletConnected]);

  /*
    renderButton: Returns a button based on the state of the dapp
  */
 const renderButton = () => {
  // If wallet is not connectd, return a button which allows them to connect their wallet
  if (!walletConnected) {
    return (
      <button onClick={connectWallet} className={styles.button}>
        Connect your wallet
      </button>
    );
  }

  // If we are currently waiting for something, return a loading button
  if (loading) {
    return <button className={styles.button}>Loading...</button>;
  }

  return (
    <button className={styles.button} onClick={publicMint}>
      Public Mint!
    </button>
  );
 };

 return (
  <div>
    <Head>
      <title>LW3Punks</title>
      <meta name="description" content="LW3Punks-Dapp" />
      <link ref="icon" href="/favicon.ico" />
    </Head>
    <div className={styles.main}>
      <div>
        <h1 className={styles.title}>Welcome to LW3Punks!</h1>
        <div className={styles.description}>
          Its an NFT colection for Learnweb3 students.
        </div>
        <div className={styles.description}>
          {tokenIdsMinted}/10 have been minted
        </div>
        {renderButton()}
      </div>
      <div>
      <img className={styles.image} src="./LW3Punks/1.png" />
      </div>
    </div>

    <footer className={styles.footer}> Made with &#10084; by LW3Punks </footer>
  </div>
 )
}
