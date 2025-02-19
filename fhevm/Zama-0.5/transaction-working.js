const fhevm = require('fhevmjs');
const Web3 = require('web3');
const fs = require('fs');

async function main() {
    // Initialize Web3 and connect to the network
    const web3 = new Web3.default('https://devnet.zama.ai');

    // Replace with your private key
    const privateKey = '0x7afdf33a1523bf6fb353261ab6d51884d0d1b2aa2c9c7e67bbd4f7fe0adae361';

    // Replace with your deployed contract address
    const contractAddress = '0x8fca2cf659f4e28f156074ca9b54aaefb295d41a';
    const userAddress = '0x3b31fC0b4B81184078AFB1835810A6C732Fcd9E1';
    
    // Derive the account from the private key
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);
    web3.eth.accounts.wallet.add(account);
    web3.eth.defaultAccount = account.address;

    // Read the ABI from the JSON file
    const contractJson = JSON.parse(fs.readFileSync('./artifacts/examples/Counter.sol/Counter.json', 'utf8'));
    const abi = contractJson.abi; // Ensure this is the correct path to the ABI within your JSON structure

    // Create a contract instance
    const contract = new web3.eth.Contract(abi, contractAddress);

    // Create an FHE instance and encrypted input
    const instance = await fhevm.createInstance({ networkUrl: "https://devnet.zama.ai" });
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
