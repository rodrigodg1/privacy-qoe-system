const Web3 = require('web3');
const web3 = new Web3.default('https://devnet.zama.ai');
//const web3 = new Web3.default('http://localhost:8545');
const fs = require('fs');


web3.eth.net.isListening()
    .then(() => console.log('Connected to the blockchain'))
    .catch(e => { throw new Error('Failed to connect to the blockchain.') });

// MetaMask private key (with 0x prefix)
//check metamask for private key
const privateKey_Zama_Dev = '0x3611d97e4794cd95dead683db1698b5b9d171f0c0ad4cbac2f8d88cc9ee591a5';
const privateKey_local = '0x3611d97e4794cd95dead683db1698b5b9d171f0c0ad4cbac2f8d88cc9ee591a5';

privateKey = privateKey_Zama_Dev;

// Validate the private key
if (privateKey.length !== 66 || !privateKey.startsWith('0x') || !/^[0-9a-fA-F]+$/.test(privateKey.slice(2))) {
    throw new Error('Invalid Private Key: Ensure it is 64 hex characters with 0x prefix.');
}

// Derive the account from the private key
const account = web3.eth.accounts.privateKeyToAccount(privateKey);
console.log(`Deploying from account: ${account.address}`);

// Load the contract's ABI and bytecode (Adjust the path to your JSON file)
//const contractJson = JSON.parse(fs.readFileSync('./artifacts/examples/Rand.sol/Rand.json', 'utf8'));
const contractJson = JSON.parse(fs.readFileSync('./artifacts/examples/QoEEvaluator.sol/QoEEvaluator.json', 'utf8'));
const abi = contractJson.abi;
const bytecode = contractJson.bytecode;

// Set up the contract object
const Contract = new web3.eth.Contract(abi);

// Estimate gas required for deployment and then proceed with the transaction
Contract.deploy({ data: bytecode })
    .estimateGas()
    .then(gasEstimate => {
        console.log(`Estimated Gas: ${gasEstimate}`);

        // Get the latest transaction nonce for the account
        return web3.eth.getTransactionCount(account.address).then(nonce => {
            // Build the transaction
            const tx = Contract.deploy({ data: bytecode })
                .encodeABI();

            const transaction = {
                chainId: 9000,  // Set your network's chainId
                gas: gasEstimate,
                //gas: gasEstimate + 1000,
                gasPrice: web3.utils.toWei('20', 'gwei'),
                nonce: nonce,
                data: tx,
                from: account.address
            };

            // Sign the transaction with the private key
            return web3.eth.accounts.signTransaction(transaction, privateKey);
        });
    })
    .then(signedTx => {
        // Send the transaction to the blockchain
        return web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    })
    .then(receipt => {
        console.log(`Contract deployed at address: ${receipt.contractAddress}`);
    })
    .catch(error => {
        console.error('Error:', error);
    });