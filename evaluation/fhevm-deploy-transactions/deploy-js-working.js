const Web3 = require('web3');
//const web3 = new Web3.default('https://devnet.zama.ai');
const fs = require('fs');

const provider = "https://rpc.ankr.com/eth_sepolia";
const provider_csv = "sepolia";


const web3 = new Web3.default(provider);

//const privateKey_Zama_Dev = '0x875ab559e894777b3b3486b09f91369b4d3a1ab0d5bfebbf12299182940dcf26';
const privatekey_sepolia = '0x875ab559e894777b3b3486b09f91369b4d3a1ab0d5bfebbf12299182940dcf26'
//const privateKey_local = '0x875ab559e894777b3b3486b09f91369b4d3a1ab0d5bfebbf12299182940dcf26';

privateKey = privatekey_sepolia;


web3.eth.net.isListening()
    .then(() => console.log('Connected to the blockchain'))
    .catch(e => { throw new Error('Failed to connect to the blockchain.') });


// Validate the private key
if (privateKey.length !== 66 || !privateKey.startsWith('0x') || !/^[0-9a-fA-F]+$/.test(privateKey.slice(2))) {
    throw new Error('Invalid Private Key: Ensure it is 64 hex characters with 0x prefix.');
}

// Derive the account from the private key
const account = web3.eth.accounts.privateKeyToAccount(privateKey);
console.log(`Deploying from account: ${account.address}`);

// Load the contract's ABI and bytecode (Adjust the path to your JSON file)
//const contractJson = JSON.parse(fs.readFileSync('./artifacts/examples/QoEEvaluatorMOS.sol/QoEEvaluatorMOS.json', 'utf8'));
const contractJson = JSON.parse(fs.readFileSync("./artifacts/contracts/sub_QoEEvaluatorITEMS.sol/sub_QoEEvaluatorITEMS.json", "utf8"));
const abi = contractJson.abi;
const bytecode = contractJson.bytecode;

// Set up the contract object
const Contract = new web3.eth.Contract(abi);




const readline = require('readline');

// Create an interface for reading user input from the terminal
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Function to prompt the user for confirmation
function askForConfirmation(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
        });
    });
}

// Estimate gas required for deployment and then proceed with the transaction
Contract.deploy({ data: bytecode })
    .estimateGas()
    .then(gasEstimate => {
        console.log(`Estimated Gas: ${gasEstimate}`);
        
        // Convert gasPrice to Wei and ensure it's a BigInt (4 Gwei)
        const gasPriceInWei = BigInt(web3.utils.toWei('4', 'gwei'));  // 4 Gwei base fee
        
        // Calculate the estimated cost in Ether using BigInt arithmetic
        const estimatedCostInWei = gasEstimate * gasPriceInWei;  // Both gasEstimate and gasPriceInWei are BigInts
        const estimatedCostInEther = web3.utils.fromWei(estimatedCostInWei.toString(), 'ether');  // Convert back to string for fromWei
        
        console.log(`Estimated Cost: ${estimatedCostInEther} ETH`);

        // Ask the user for confirmation before proceeding
        return askForConfirmation(`Do you want to proceed with the transaction? (Estimated Gas: ${gasEstimate}, Estimated Cost: ${estimatedCostInEther} ETH) [y/n]: `)
            .then(shouldProceed => {
                if (!shouldProceed) {
                    console.log('Transaction canceled by the user.');
                    rl.close();
                    return null; // Return null to indicate cancellation
                }
                return gasEstimate; // Pass gasEstimate along the promise chain
            });
    })
    .then(gasEstimate => {
        if (!gasEstimate) {
            // If the user canceled the transaction, exit early
            return;
        }

        // Get the latest transaction nonce for the account
        return web3.eth.getTransactionCount(account.address).then(nonce => {
            // Build the transaction
            const tx = Contract.deploy({ data: bytecode })
                .encodeABI();
            const transaction = {
                chainId: 11155111,  // Set your network's chainId (Sepolia)
                gas: gasEstimate,  // Use the gasEstimate passed from the previous step
                gasPrice: web3.utils.toWei('20', 'gwei'),  // 4 Gwei base fee
                nonce: nonce,
                data: tx,
                from: account.address
            };
            // Sign the transaction with the private key
            return web3.eth.accounts.signTransaction(transaction, privateKey);
        });
    })
    .then(signedTx => {
        if (!signedTx) {
            // If the user canceled the transaction, exit early
            return;
        }
        // Send the transaction to the blockchain
        return web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    })
    .then(receipt => {
        if (!receipt) {
            // If the user canceled the transaction, exit early
            return;
        }
        console.log(`Contract deployed at address: ${receipt.contractAddress}`);
        
        // Log the actual gas used and the actual cost
        const actualGasUsed = receipt.gasUsed;
        console.log(`Actual Gas Used: ${actualGasUsed}`);
        
        // Calculate the actual cost in Ether
        const gasPriceInWei = BigInt(web3.utils.toWei('4', 'gwei'));  // Ensure gasPrice is a BigInt
        const actualCostInWei = BigInt(actualGasUsed) * gasPriceInWei;  // Both actualGasUsed and gasPriceInWei are BigInts
        const actualCostInEther = web3.utils.fromWei(actualCostInWei.toString(), 'ether');  // Convert back to string for fromWei
        
        console.log(`Actual Cost: ${actualCostInEther} ETH`);
        rl.close();  // Close the readline interface
    })
    .catch(error => {
        console.error('Error:', error);
        rl.close();  // Ensure the readline interface is closed in case of an error
    });







