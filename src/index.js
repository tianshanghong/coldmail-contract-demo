import { ethers } from 'ethers';
import CoinbaseWalletSDK from '@coinbase/wallet-sdk';
import 'buffer';

window.Buffer = window.Buffer || require('buffer').Buffer;

// Configuration for Coinbase Wallet
const APP_NAME = 'Email Tips DApp';
const APP_LOGO_URL = 'https://example.com/logo.png';
const DEFAULT_ETH_JSONRPC_URL = 'https://sepolia.base.org';
const DEFAULT_CHAIN_ID = 84532; // Use actual chain ID for Sepolia
const CONTRACT_ADDRESS = '0x776a54E730F9bFBB45d29c7ae3712f8Eb52eAF15';
const CONTRACT_ABI = [{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"emailId","type":"uint256"},{"indexed":true,"internalType":"address","name":"recipient","type":"address"}],"name":"EmailRead","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"emailId","type":"uint256"},{"indexed":true,"internalType":"address","name":"recipient","type":"address"},{"indexed":false,"internalType":"uint256","name":"tipAmount","type":"uint256"},{"indexed":false,"internalType":"string","name":"content","type":"string"}],"name":"EmailSent","type":"event"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"emails","outputs":[{"internalType":"address","name":"sender","type":"address"},{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"tipAmount","type":"uint256"},{"internalType":"bool","name":"isRead","type":"bool"},{"internalType":"string","name":"content","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"nextEmailId","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_emailId","type":"uint256"}],"name":"readEmailAndClaimTip","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_recipient","type":"address"},{"internalType":"string","name":"_content","type":"string"}],"name":"sendEmailWithTip","outputs":[],"stateMutability":"payable","type":"function"}]

// Initialize provider and signer variables
let provider;
let signer;


document.getElementById('send_button').addEventListener('click', sendEmail);
document.getElementById('read_button').addEventListener('click', readEmail);

async function initializeWallet() {

    const coinbaseWallet = new CoinbaseWalletSDK({
        appName: APP_NAME,
        appLogoUrl: APP_LOGO_URL,
    });


    const ethereum = coinbaseWallet.makeWeb3Provider(DEFAULT_ETH_JSONRPC_URL, DEFAULT_CHAIN_ID);
    window.ethereum = ethereum;
    provider = new ethers.BrowserProvider(window.ethereum)

    signer = await provider.getSigner();

    // Enable buttons once the provider is ready
    document.getElementById('send_button').disabled = false;
    document.getElementById('read_button').disabled = false;
}
async function connectContract() {
    try {
        return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    } catch (err) {
        console.error('Failed to connect to contract:', err);
    }
}
async function requestAccount() {
    try {
        // Request account access if necessary
        await provider.send("eth_requestAccounts", []);
    } catch (error) {
        console.error('Failed to get account access:', error);
        alert('Failed to get account access. Please make sure your wallet is connected.');
        return false;
    }
    return true;
}

async function sendEmail() {
    if (!await requestAccount()) return;

    const contract = await connectContract();
    if (!contract) {
        alert('Failed to connect to the contract.');
        return;
    }

    const recipient = document.getElementById('send_address').value;
    const content = document.getElementById('send_content').value;
    const tipValue = document.getElementById('send_tip').value;
    let tip;

    try {
        tip = ethers.parseEther(tipValue);
    } catch (err) {
        console.error('Failed to parse ether value:', err);
        alert('Failed to parse tip amount.');
        return;
    }

    try {
        const tx = await contract.sendEmailWithTip(recipient, content, { value: tip });
        await tx.wait();
        alert('Email sent!');
    } catch (err) {
        console.error('Failed to send email:', err);
        alert('Failed to send email!');
    }
}


async function readEmail() {
    const contract = await connectContract();
    if (!contract) {
        alert('Failed to connect to the contract.');
        return;
    }

    const emailId = document.getElementById('read_emailId').value;

    try {
        const tx = await contract.readEmailAndClaimTip(emailId);
        await tx.wait();
        alert('Email read and tip claimed!');
    } catch (err) {
        console.error('Failed to read email:', err);
        alert('Failed to read email!');
    }
}


// Initialize Coinbase Wallet connection on load
window.onload = function () {
    document.getElementById('send_button').disabled = true;
    document.getElementById('read_button').disabled = true;
    initializeWallet();
};