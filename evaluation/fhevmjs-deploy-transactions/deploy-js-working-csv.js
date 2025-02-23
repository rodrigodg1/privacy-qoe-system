const Web3 = require('web3');
const fs = require('fs');

const provider = "https://rpc.ankr.com/eth_sepolia";
//const provider = "https://sepolia.drpc.org";
const provider_csv = "sepolia";
const web3 = new Web3.default(provider);
const privateKey = '0x875ab559e894777b3b3486b09f91369b4d3a1ab0d5bfebbf12299182940dcf26';

// Variables to hold estimated values and network fees
let estimatedGas;
let estimatedCost;
let baseFeePerGas;

web3.eth.net.isListening()
    .then(() => console.log('Connected to the blockchain'))
    .catch(e => { throw new Error('Failed to connect to the blockchain.') });

// Validate private key and derive account
if (privateKey.length !== 66 || !privateKey.startsWith('0x') || !/^[0-9a-fA-F]+$/.test(privateKey.slice(2))) {
    throw new Error('Invalid Private Key');
}
const account = web3.eth.accounts.privateKeyToAccount(privateKey);
console.log(`Deploying from account: ${account.address}`);

// Load contract ABI and bytecode
const contractJson = JSON.parse(fs.readFileSync("./artifacts/contracts/sub_QoEEvaluatorITEMS.sol/sub_QoEEvaluatorITEMS.json", "utf8"));
const abi = contractJson.abi;
const bytecode = contractJson.bytecode;
const Contract = new web3.eth.Contract(abi);






// Sign and send the transaction with event listeners for better feedback
async function sendTransaction(signedTx) {
    return new Promise((resolve, reject) => {
      web3.eth.sendSignedTransaction(signedTx.rawTransaction)
        .on('transactionHash', (hash) => {
          console.log(`Transaction hash received: ${hash}`);
        })
        .on('receipt', (receipt) => {
          console.log(`Transaction mined in block ${receipt.blockNumber}`);
          resolve(receipt);
        })
        .on('error', (error) => {
          console.error('Transaction error:', error);
          reject(error);
        });
    });
  }
  

// Helper function to get the latest fee data from the network
async function getFeeData() {
    // Retrieve the latest block to obtain the current base fee
    const latestBlock = await web3.eth.getBlock('latest');
    if (!latestBlock || !latestBlock.baseFeePerGas) {
        throw new Error('Unable to fetch base fee; network may not support EIP-1559.');
    }
    // Convert the base fee to BigInt for precise arithmetic
    const baseFeePerGas = BigInt(latestBlock.baseFeePerGas);
    // Set the max priority fee (tip) - adjust as needed
    const maxPriorityFeePerGas = BigInt(web3.utils.toWei('0.5', 'gwei'));
    // Apply a buffer multiplier (e.g., 20% increase) to the base fee
    const bufferMultiplier = 1.2;
    const maxFeePerGas = BigInt(Math.floor(Number(baseFeePerGas) * bufferMultiplier)) + maxPriorityFeePerGas;
    
    return { baseFeePerGas, maxPriorityFeePerGas, maxFeePerGas };
}

// Example usage within your deployContract function
async function deployContract(nonce) {
    try {
        // Fetch updated fee data immediately before building the transaction
        const { baseFeePerGas, maxPriorityFeePerGas, maxFeePerGas } = await getFeeData();
        
        // Estimate gas for deployment
        const gasEstimate = await Contract.deploy({ data: bytecode }).estimateGas();
        console.log(`Estimated Gas: ${gasEstimate}`);

        // Estimated cost calculation
        const estimatedCostInWei = gasEstimate * maxFeePerGas;
        const estimatedCostInEther = web3.utils.fromWei(estimatedCostInWei.toString(), 'ether');
        console.log(`Estimated Cost: ${estimatedCostInEther} ETH`);

        // Build the transaction
        const tx = Contract.deploy({ data: bytecode }).encodeABI();
        const transaction = {
            chainId: 11155111,
            gas: gasEstimate,
            gasPrice: maxFeePerGas,
            nonce: nonce,
            data: tx,
            from: account.address
        };

        // Sign and send the transaction
        const signedTx = await web3.eth.accounts.signTransaction(transaction, privateKey);
        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        console.log(`Contract Address: ${receipt.contractAddress}`);

        // Logging actual cost details...
        const actualGasUsed = receipt.gasUsed;
        const effectiveGasPrice = BigInt(receipt.effectiveGasPrice);
        const actualCostInWei = BigInt(actualGasUsed) * effectiveGasPrice;
        const actualCostInEther = web3.utils.fromWei(actualCostInWei.toString(), 'ether');

        // Update CSV with actual gas price details
        const csvHeader = 'Estimated Gas,Estimated Cost (ETH),Contract Address,Actual Gas Used,Actual Cost (ETH),Network,Actual Gas Price (Wei)\n';
        const csvRow = `${gasEstimate},${estimatedCostInEther},${receipt.contractAddress},${actualGasUsed},${actualCostInEther},${provider_csv},${effectiveGasPrice}\n`;
        const filename = 'deployment_details.csv';
        if (!fs.existsSync(filename)) {
            fs.writeFileSync(filename, csvHeader);
        }
        fs.appendFileSync(filename, csvRow);
        console.log('Data saved to deployment_details.csv');

        return receipt;
    } catch (error) {
        console.error('Error during deployment:', error);
        throw error;
    }
}






// Main function to perform 50 deployments
async function performDeployments() {
    try {
        // Get the initial nonce
        let nonce = await web3.eth.getTransactionCount(account.address, "pending");


        // Perform 50 deployments
        for (let i = 0; i < 32; i++) {
            console.log(`Starting deployment ${i + 1}...`);
            await deployContract(nonce);
            nonce++; // Increment nonce for the next deployment
            console.log(`Deployment ${i + 1} completed.`);
            await new Promise(resolve => setTimeout(resolve, 30000));
        }

        console.log('All 50 deployments completed successfully.');
    } catch (error) {
        console.error('Error during deployments:', error);
    }
}

// Start the deployment process
performDeployments();
