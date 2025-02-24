const fhevm = require('fhevmjs');
const Web3 = require('web3');
const fs = require('fs');

async function main() {
    // Initialize Web3 and connect to the network
    const web3 = new Web3.default('http://localhost:8545');

    // Replace with your private key
    const privateKey = '';

    // Replace with your deployed contract address
    const contractAddress = '0x7f4d0519b471e8ce403ef62485273dbf84da7b18';
    const userAddress = '0x346177914A6300Bcdc2a4B0521308CEa3D9Bc475';
    
    // Derive the account from the private key
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);
    web3.eth.accounts.wallet.add(account);
    web3.eth.defaultAccount = account.address;

    // Read the ABI from the JSON file
    const contractJson = JSON.parse(fs.readFileSync('./artifacts/contracts/QoEEvaluatorMOS.sol/QoEEvaluatorMOS.json', 'utf8'));
    const abi = contractJson.abi; // Ensure this is the correct path to the ABI within your JSON structure

    // Create a contract instance
    const contract = new web3.eth.Contract(abi, contractAddress);

    // Create an FHE instance and encrypted input
    const instance = await fhevm.createInstance({ networkUrl: "http://localhost:8545" });
    console.log('FHEVM instance created:', instance);

    try {
        const input = instance.createEncryptedInput(contractAddress, userAddress);
        console.log('Input object created:', input);

        const { handles, inputProof } = input.add8(10).encrypt();

        console.log('Encrypted input:', inputProof);

        // Estimate gas for the transaction
        const gasEstimate = await contract.methods.add(handles[0], inputProof).estimateGas({ from: account.address });
        console.log(`Estimated Gas: ${gasEstimate}`);

        // Send the transaction to the smart contract
        const receipt = await contract.methods.add(handles[0], inputProof)
            .send({
                from: account.address,
                gas: gasEstimate,
                gasPrice: web3.utils.toWei('20', 'gwei')
            });

        console.log('Transaction successful with hash:', receipt.transactionHash);
        console.log('Transaction receipt:', receipt);

        // Fetch the current counter value after the transaction
        const counter = await contract.methods.getCounter().call({ from: account.address });
        console.log('Current encrypted counter:', counter);

    } catch (error) {
        console.error('Error during transaction:', error);
    }
}

main().catch(console.error);
