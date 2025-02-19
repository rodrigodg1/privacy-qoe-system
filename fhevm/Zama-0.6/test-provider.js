import { JsonRpcProvider } from 'ethers';

// Connect to the Ethereum network
const provider = new JsonRpcProvider("https://rpc.ankr.com/eth_sepolia");

// Get the network details (including chain ID)
const network = await provider.getNetwork();

console.log("Network Chain ID:", network.chainId);
console.log("Network Name:", network.name);