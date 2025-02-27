const fhevm = require("fhevmjs");
const Web3Lib = require("web3");
const Web3 = Web3Lib.default || Web3Lib;
const fs = require("fs");
const { createInstance } = require("fhevmjs");

// RPC provider for Sepolia
const provider = "https://rpc.ankr.com/eth_sepolia";

// Configuration constants
const PRIVATE_KEY = '';
const CONTRACT_ADDRESS = "0xcD6b88EdBc0aA0420d0792DCa66f202F1b2c0D49";
const USER_ADDRESS = "";

// Create an fhevm instance using your configuration
async function initializeFhevm() {
  return createInstance({
    chainId: 11155111,
    networkUrl: provider, // Sepolia RPC URL
    kmsContractAddress: "0x9D6891A6240D6130c54ae243d8005063D05fE14b",
    aclContractAddress: "0xFee8407e2f5e3Ee68ad77cAE98c434e637f516e5",
    gatewayUrl: "https://gateway.sepolia.zama.ai/",
  });
}

async function main() {
  // Initialize fhevm instance
  const instance = await initializeFhevm();

  // Set up Web3 and add your account
  const web3 = new Web3(provider);
  const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY);
  web3.eth.accounts.wallet.add(account);
  web3.eth.defaultAccount = account.address;

  // Load the contract ABI from your artifacts (adjust file path as needed)
  const contractJson = JSON.parse(fs.readFileSync("./artifacts/contracts/teste.sol/teste.json", "utf8"));
  const abi = contractJson.abi;
  const contract = new web3.eth.Contract(abi, CONTRACT_ADDRESS);

  // Create an encrypted input for the amount (e.g., encrypt the uint8 value 42)
  const amountToEncrypt = 42;
  const input = instance.createEncryptedInput(CONTRACT_ADDRESS, USER_ADDRESS);
  // Await the asynchronous encryption process
  const encryptedInput = await input.add8(amountToEncrypt).encrypt();
  console.log("Encrypted input details:", encryptedInput);

  try {
    // Build the transaction to call myExample with the encrypted input and its proof
    const tx = contract.methods.myExample(
      encryptedInput.handles[0],  // Encrypted amount (einput)
      encryptedInput.inputProof   // Proof validating the encryption
    );

    // Estimate gas for the transaction
    const gasEstimate = await tx.estimateGas({ from: account.address });
    console.log("Estimated gas:", gasEstimate);

    // Send the transaction
    const receipt = await tx.send({
      from: account.address,
      gas: gasEstimate,
    });
    console.log("Transaction successful, hash:", receipt.transactionHash);

    // Retrieve the encrypted balance from the contract for verification
    const encryptedBalance = await contract.methods.getEncryptedBalance().call();
    console.log("Encrypted balance retrieved:", encryptedBalance);
  } catch (error) {
    console.error("Error sending transaction:", error);
  }
}

main().catch(console.error);
