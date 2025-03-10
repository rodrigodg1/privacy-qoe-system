const fhevm = require("fhevmjs");
const Web3 = require("web3").default;
const fs = require("fs");
const { createInstance } = require("fhevmjs");

const provider = "http://localhost:8545";
const contractAddress = "0x489ce2a9a7d6706ff671913693f0f39e5af73453"; // Verify
const providerLabel = "local";

const createFhevmInstance = async () => {
  return createInstance({
    chainId: 9000,
    networkUrl: provider,
    kmsContractAddress: "0x12B064FB845C1cc05e9493856a1D637a73e944bE",
    aclContractAddress: "0x2Fb4341027eb1d2aD8B5D9708187df8633cAFA92",
    gatewayUrl: "http://localhost:7077" // Confirm port
  });
};

createFhevmInstance().then(async (instance) => {
  try {
    console.log("FHEVM instance:", instance);
    const web3 = new Web3(provider);
    const privateKey = "0x45e0697217918fd8e33b148083b41cb18d2db1bcf5562fd3a9c8d4dae3da0fe6"; // Ensure matches address
    const userAddress = "0x22cC8c0E87971a003c493466A8504825F3492Ad5";
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);
    web3.eth.accounts.wallet.add(account);
    web3.eth.defaultAccount = account.address;

    const contractArtifact = JSON.parse(
      fs.readFileSync("./artifacts/contracts/teste.sol/teste.json", "utf8")
    );
    const abi = contractArtifact.abi;
    const contract = new web3.eth.Contract(abi, contractAddress);

    const amountToEncrypt = 8;
    const input = instance.createEncryptedInput(contractAddress, userAddress);
    input.add8(amountToEncrypt); 
    const inputs = await input.encrypt();
    console.log("Encrypted Input Proof:", inputs.inputProof);
    console.log("Encrypted Input:", inputs.handles[0]);

    const method = contract.methods.myExample(inputs.handles[0], inputs.inputProof);
    const gasEstimate = await method.estimateGas({ from: userAddress });
    const nonce = await web3.eth.getTransactionCount(userAddress);
    const gasLimit = Math.ceil(Number(gasEstimate) * 1.5); // Increased buffer

    try {
      const txReceipt = await method.send({
        gas: 30000000, // Hardcoded high gas limit for testing
        gasPrice: web3.utils.toWei("60", "gwei"),
      });
      console.log(`Transaction successful. Hash: ${txReceipt.transactionHash}`);
    } catch (txError) {
      console.error('Transaction Error:', txError.message);
    }
  } catch (error) {
    console.error("Execution Error:", error.message);
  }
}).catch((initError) => {
  console.error("Initialization Error:", initError.message);
});