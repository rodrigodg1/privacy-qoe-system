/**
 * This script reads the compiled smart contract JSON file and computes the bytecode size.
 * It calculates the size in bytes by removing the '0x' prefix (if present) and dividing the remaining length by 2.
 */

const fs = require('fs');

// Specify the path to your compiled contract JSON file
const contractPath = "./artifacts/contracts/mult_QoEEvaluatorITEMS.sol/mult_QoEEvaluatorITEMS.json";

try {
    // Read and parse the contract JSON file
    const contractJson = JSON.parse(fs.readFileSync(contractPath, "utf8"));
    
    // Extract the bytecode from the contract JSON
    const bytecode = contractJson.bytecode;
    
    if (!bytecode) {
        throw new Error("Bytecode not found in the contract JSON.");
    }
    
    // Calculate the size in bytes:
    // Remove the '0x' prefix if it exists and divide the length by 2 (since each byte is represented by 2 hex characters)
    const bytecodeSize = (bytecode.startsWith("0x") ? bytecode.slice(2).length : bytecode.length) / 2;
    
    console.log(`Bytecode size: ${bytecodeSize} bytes`);
} catch (error) {
    console.error("Error reading the contract file or computing the bytecode size:", error);
}
