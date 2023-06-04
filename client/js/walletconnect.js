"use strict";

/**
 * Example JavaScript code that interacts with the page and Web3 wallets
 */

 // Unpkg imports
const Web3Modal = window.Web3Modal.default;
const WalletConnectProvider = window.WalletConnectProvider.default;
const evmChains = window.evmChains;

// Web3modal instance
let web3Modal

// Chosen wallet provider given by the dialog window
let provider;


// Address of the selected account
let selectedAccount;


/**
 * Setup the orchestra
 */
function init() {

  console.log("Initializing example");
  console.log("WalletConnectProvider is", WalletConnectProvider);
  console.log("window.web3 is", window.web3, "window.ethereum is", window.ethereum);

  // Check that the web page is run in a secure context,
  // as otherwise MetaMask won't be available
  if(location.protocol !== 'https:') {
    // https://ethereum.stackexchange.com/a/62217/620
    //const alert = document.querySelector("#alert-error-https");
    //alert.style.display = "block";
    //document.querySelector("#btn-connect").setAttribute("disabled", "disabled")
    return;
  }
  // Tell Web3modal what providers we have available.
  // Built-in web browser provider (only one can exist as a time)
  // like MetaMask, Brave or Opera is added automatically by Web3modal
  const providerOptions = {
    walletconnect: {
      package: WalletConnectProvider,
      options: {
        rpc: {
          1: 'https://api.etherscan.io/'
        },
        pollingInterval: 3600000, // 1 hour
        network: 'mainnet',
        chainId: 1
      }
    }
  };
  
  web3Modal = new Web3Modal({
    cacheProvider: false, // optional
    providerOptions, // required
    disableInjectedProvider: false, // optional. For MetaMask / Brave / Opera.
  });

  console.log("Web3Modal instance is", web3Modal);
}

function connectWalletConnect(){
  console.log("WalletConnectProvider is", WalletConnectProvider);
  console.log("window.web3 is", window.web3, "window.ethereum is", window.ethereum);

  // Check that the web page is run in a secure context,
  // as otherwise MetaMask won't be available
  if(location.protocol !== 'https:') {
    // https://ethereum.stackexchange.com/a/62217/620
    const alert = document.querySelector("#alert-error-https");
    alert.style.display = "block";
    document.querySelector("#btn-connect").setAttribute("disabled", "disabled")
    return;
  }

  // Tell Web3modal what providers we have available.
  // Built-in web browser provider (only one can exist as a time)
  // like MetaMask, Brave or Opera is added automatically by Web3modal
  const providerOptions = {
    walletconnect: {
      package: WalletConnectProvider,
      options: {
        rpc: {
          1: 'https://api.etherscan.io/'
        },
        pollingInterval: 3600000, // 1 hour
        network: 'mainnet',
        chainId: 1
      }
    }
  };
  


  web3Modal = new Web3Modal({
    cacheProvider: false, // optional
    providerOptions, // required
    disableInjectedProvider: true, // optional. For MetaMask / Brave / Opera.
  });

  console.log("Web3Modal instance is", web3Modal);
}
function showSpinner(remove=true) {
  if (!remove) {
    // Remove the spinner and overlay elements from the DOM
    document.querySelector('.spinner').remove();
    document.querySelector('.overlay').remove();
    return;
  }

  // Create a new div element for the overlay
  const overlay = document.createElement('div');
  overlay.className = 'overlay';

  // Add the overlay element to the DOM
  document.body.appendChild(overlay);

  // Apply CSS styles to the overlay element
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';

  // Create a new div element for the spinner
  const spinner = document.createElement('div');
  spinner.className = 'spinner';

  // Add the spinner element to the DOM
  document.body.appendChild(spinner);

  // Apply CSS styles to the spinner element
  spinner.style.width = '40px';
  spinner.style.height = '40px';
  spinner.style.borderRadius = '50%';
  spinner.style.border = '3px solid #f3f3f3';
  spinner.style.borderTop = '3px solid #3498db';
  spinner.style.animation = 'spin 0.8s linear infinite';
  spinner.style.position = 'fixed';
  spinner.style.top = '50%';
  spinner.style.left = '50%';
  spinner.style.transform = 'translate(-50%, -50%)';

  // Define the keyframe animation for the spinner
  const keyframes = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;

  // Add the keyframe animation to the document head
  const style = document.createElement('style');
  style.appendChild(document.createTextNode(keyframes));
  document.head.appendChild(style);
}

/**
 * Kick in the UI action after Web3modal dialog has chosen a provider
 */
async function fetchAccountData() {
  // add a js spinner while this loads
  showSpinner(true);
  const web3 = new Web3(provider);

  console.log("Web3 instance is", web3);

  const chainId = await web3.eth.getChainId();
  const networkName = getNetworkName(chainId);
  document.querySelector("#network-name").textContent = networkName;

  const accounts = await web3.eth.getAccounts();
  console.log("Got accounts", accounts);
  selectedAccount = accounts[0];

  document.querySelector("#selected-account").textContent = selectedAccount;

  // Get account balance from Etherscan API
  //const balance = await getAccountBalance(selectedAccount);
  //document.querySelector("#account-balance").textContent = formatBalance(balance);
  // Get account id from loopring API
  const loopringID = await getLoopringAccountID(selectedAccount);
  document.querySelector("#loopring-account-ID").textContent = loopringID;
	const ownedNFTs = await getLoopringNFTs(loopringID);

  document.querySelector("#prepare").style.display = "none";
  document.querySelector("#connected").style.display = "block";
  document.querySelector("#btn-connect").style.display = "none";
  if(document.querySelector("#btn-connect").getAttribute("redirect")=="1"){
		window.location.reload();
}
showSpinner(false);
}

async function hasMembership(nftAddress) {
  const loopringID = await getLoopringAccountID(selectedAccount);
  const ownedNFTs = await getLoopringNFTs(loopringID);
  
  for (let i = 0; i < ownedNFTs.data.length; i++) {
    const nft = ownedNFTs.data[i];
    if (nft.tokenAddress.trim().toLowerCase() === nftAddress.trim().toLowerCase()) {
      return true;
    }
  }
  
  return false;
}
async function hasMembershipByMinter(minterAddress) {
  const loopringID = await getLoopringAccountID(selectedAccount);
  const ownedNFTs = await getLoopringNFTs(loopringID);

  for (let i = 0; i < ownedNFTs.data.length; i++) {
    const nft = ownedNFTs.data[i];
    if (nft.minter.toLowerCase() === minterAddress.toLowerCase()) {
      return true;
    }
  }

  return false;
}


function getNetworkName(chainId) {
  const chainData = evmChains.getChain(chainId);
  return chainData ? chainData.name : "Unknown network";
}



function formatBalance(balance) {
  return '${Web3.utils.fromWei(balance, "ether")} ETH';
}

async function getLoopringAccountID(account) {
  const headers = {
    'Content-Type': 'application/json',
    'X-API-KEY': '',
    'X-Proxy-Key': looppressKey
  };
  
  const response = await fetch('https://loopquest.io/wp-content/plugins/LoopPress/proxy.php?url=https://api3.loopring.io/api/v3/account&owner='+account, {
    headers: headers
  });const data = await response.json();
  return data.accountId;
}


async function getLoopringNFTs(account){
  // Ethereum address of the user whose NFT balances to retrieve
  const userAddress = account;
  // API endpoint URL
  const apiUrl ='https://loopquest.io/wp-content/plugins/LoopPress/proxy.php?url=https://api3.loopring.io/api/v3/user/nft/balances&owner='+account;
  // HTTP headers for the API request
  const headers = {
    'Content-Type': 'application/json',
    'LoopQuest-LoopPress-Key': "fdsafsdafdsaf",
  };
  // Make the API request using fetch()
  const NFTlist = await fetch(apiUrl, {
    method: 'GET',
    headers: headers
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response;
  })
  .catch(error => {
    // API request failed, display an error message
    console.error('Error retrieving NFT balances:', error);
  });
  return NFTlist;
}

/** 
 * Fetch account data for UI when
 * - User switches accounts in wallet
 * - User switches networks in wallet
 * - User connects wallet initially
 */
async function refreshAccountData() {

  // If any current data is displayed when
  // the user is switching acounts in the wallet
  // immediate hide this data
  document.querySelector("#connected").style.display = "none";
  document.querySelector("#prepare").style.display = "block";

  // Disable button while UI is loading.
  // fetchAccountData() will take a while as it communicates
  // with Ethereum node via JSON-RPC and loads chain data
  // over an API call.
  document.querySelector("#btn-connect").setAttribute("disabled", "disabled")
  await fetchAccountData(provider);
  document.querySelector("#btn-connect").removeAttribute("disabled")
}


/**
 * Connect wallet button pressed.
 */
async function onConnect() {

  console.log("Opening a dialog", web3Modal);
  try {
    provider = await web3Modal.connect();
    //fetchAccountData();
  } catch(e) {
    console.log("Could not get a wallet connection", e);
    return;
  }

  // Subscribe to accounts change
  provider.on("accountsChanged", (accounts) => {
    fetchAccountData();
  });

  // Subscribe to chainId change
  provider.on("chainChanged", (chainId) => {
    fetchAccountData();
  });

  // Subscribe to networkId change
  provider.on("networkChanged", (networkId) => {
    fetchAccountData();
  });

  await refreshAccountData();
  
}

/**
 * Disconnect wallet button pressed.
 */

async function onDisconnect() {
  document.cookie = 'PHPSESSID=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
	selectedAccount = null;
// Clear the local storage
localStorage.clear();
  clear_session();
  console.log("Killing the wallet connection", provider);

  // TODO: Which providers have close method?
  if(provider.close) {
    await provider.close();

    // If the cached provider is not cleared,
    // WalletConnect will default to the existing session
    // and does not allow to re-scan the QR code with a new wallet.
    // Depending on your use case you may want or want not his behavir.
    await web3Modal.clearCachedProvider();
    provider = null;
  }



  selectedAccount = null;

  // Set the UI back to the initial state
  document.querySelector("#prepare").style.display = "block";
  document.querySelector("#btn-connect").style.display = "block";
  document.querySelector("#connected").style.display = "none";
}


/**
 * Main entry point.
 */
window.addEventListener('load', async () => {
  const connectSection = document.querySelector("#connect-wallet-section");
    if (connectSection) {
        connectSection.style.display = "block";
        document.querySelector("#btn-connect").addEventListener("click", ()=>{init();onConnect()});
        if(document.querySelector("#btn-connect").getAttribute("isLoggedIn") === "True"){
          init();
          onConnect();
        }
        // Check if user is on mobile device
      if (/Mobi/.test(navigator.userAgent)) {
        // Add a button specifically for WalletConnect
        const wcButton = document.createElement('button');
        wcButton.innerHTML = 'Connect with WalletConnect';
        wcButton.classList = 'wp-block-button__link wp-element-button';
        wcButton.style ='display:block;margin:auto;width:fit-content;margin-top:8px;';
        wcButton.onclick = function() {
          // Call the connect function for WalletConnect
          connectWalletConnect();
          onConnect();
        }
        document.querySelector("#btn-connect").parentNode.insertBefore(wcButton, document.querySelector("#btn-connect").nextSibling);
      }
    }
    const dcButton = document.querySelector("#btn-disconnect");
    if(dcButton){
      dcButton.addEventListener("click", onDisconnect);
    }
});