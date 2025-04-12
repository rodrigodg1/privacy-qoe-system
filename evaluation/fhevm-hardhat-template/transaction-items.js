// Removed: const fhevm = require("fhevmjs"); - Not needed for sending plaintext
const { Web3 } = require('web3'); // ✅ for Web3 v4+
const fs = require("fs");
const csv = require("csv-parser");
const os = require('os'); // Keep for CPU/Memory usage monitoring
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
// Removed: const { createInstance } = require("fhevmjs"); - Instance not needed for plaintext sending


// Configuration (Keep these)
// const provider_url = "http://localhost:8545"; // Example for local
const provider_url = "https://sepolia.drpc.org"; // Sepolia
const provider_csv_label = "sepolia"; // Label for CSV filename
const privateKey = process.env.PRIVATE_KEY || ''; // IMPORTANT: Use env variable or secure method
//const contractAddress = "0x57e80b81638fc630ad20d614b30cb54c5f879b62"; // Your updated contract address
//const contractAddress = "0x2158a12c7bf203cb54c041111fa990d402bd6067"; // Your updated contract address
const contractAddress = "0x2e92f94d486905a3dfdcd9aca65b5f130b362840"; // Your updated contract address

// Helper function to get CPU usage (keep if needed)
function getCpuUsage() {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    for (const cpu of cpus) {
        for (const type in cpu.times) {
            totalTick += cpu.times[type];
        }
        totalIdle += cpu.times.idle;
    }
    return {
        idle: totalIdle / cpus.length,
        total: totalTick / cpus.length
    };
}

async function main() {

    // --- Direct Web3 Setup ---
    const web3 = new Web3(provider_url);
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);
    web3.eth.accounts.wallet.add(account);
    web3.eth.defaultAccount = account.address; // Set default account for transactions
    const userAddress = account.address; // User address is the sender

    console.log(`Using account: ${userAddress}`);
    console.log(`Interacting with contract: ${contractAddress}`);
    console.log(`Using provider: ${provider_url}`);

    // --- Load Contract ABI ---
    let abi;
    try {
        // Adjust the path if your artifacts are elsewhere
        const contractJsonPath = "./artifacts/contracts/sub_QoEEvaluatorITEMS.sol/Subtracting_QoEEvaluatorITEMS.json";
        const contractJson = JSON.parse(fs.readFileSync(contractJsonPath, "utf8"));
        abi = contractJson.abi;
    } catch (err) {
        console.error("Error reading contract ABI JSON file:", err);
        process.exit(1);
    }
    const contract = new web3.eth.Contract(abi, contractAddress);

    // --- CSV Writer Setup ---
    const outputFilePath = `performance_ITEMS_metrics_client_PLAINTEXT_${provider_csv_label}_Mult.csv`;
    const fileExists = fs.existsSync(outputFilePath);
    
    const csvWriter = createCsvWriter({
        path: outputFilePath,
        header: [
            { id: "provider", title: "Provider" },
            { id: "rowNumber", title: "Row Number" },
            { id: "transactionSize", title: "Transaction Size (KB)" },
            { id: "cpuUsage", title: "Client CPU Time (ms)" },
            { id: "memoryUsage", title: "Client Memory Usage (MB)" },
            { id: "transactionConfirmationTime", title: "Transaction Confirmation Time (s)" },
            { id: "transactionHash", title: "Transaction Hash" },
            { id: "estimatedGas", title: "Estimated Gas" },
            { id: "actualGasUsed", title: "Actual Gas Used" },
            { id: "transactionCostEther", title: "Transaction Cost (ETH)" },
        ],
        append: fileExists,
    });

    // --- Read CSV and Process Data ---
    const results = [];
    const csvFilePath = "pokemon_encoded.csv"; // Ensure this path is correct
    fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on("data", (data) => results.push(data))
        .on("end", async () => {
            console.log(`Starting to process ${results.length} rows from ${csvFilePath}...`);
            for (let i = 0; i < 81; i++) {
                const row = results[i];
                console.log(`\nProcessing row ${i + 1}/${results.length}`);

                const startTime = Date.now(); // For overall processing time measurement if needed
                const startUsage = process.cpuUsage();
                const startMemUsage = process.memoryUsage().heapUsed;

                // --- Prepare Plaintext Data (Parse from CSV) ---
                let qosTypeValue, qodModelValue, qodOSVersionValue, qosOperatorValue, mosValue;
                try {
                    qosTypeValue = parseInt(row.QoS_type);
                    qodModelValue = parseInt(row.QoD_model);
                    // Handle potential hyphen in column name
                    qodOSVersionValue = parseInt(row["QoD_os-version"] || row["QoD_os_version"]);
                    qosOperatorValue = parseInt(row.QoS_operator);
                    mosValue = parseInt(row.MOS);

                    // Basic validation (ensure they are numbers and within uint8 range)
                    const values = [qosTypeValue, qodModelValue, qodOSVersionValue, qosOperatorValue, mosValue];
                    if (values.some(isNaN)) {
                        throw new Error(`Row ${i + 1} contains non-numeric data.`);
                    }
                    if (values.some(v => v < 0 || v > 255)) {
                        throw new Error(`Row ${i + 1} contains value outside uint8 range (0-255).`);
                    }

                    console.log(
                        `  Data: Type=${qosTypeValue}, Model=${qodModelValue}, OS=${qodOSVersionValue}, Op=${qosOperatorValue}, MOS=${mosValue}`
                    );

                } catch (parseError) {
                    console.error(`Error parsing data in row ${i + 1}:`, parseError.message);
                    console.error("  Row data:", row);
                    continue; // Skip this row
                }

                // --- No Client-Side Encryption ---
                const encryptionTime = 0; // Set to 0 as no encryption happens here
                const encryptedDataSize = 0; // Set to 0

                // Calculate Client-Side Performance (excluding encryption)
                const endMemUsage = process.memoryUsage().heapUsed;
                const memoryUsage = (endMemUsage - startMemUsage) / (1024 * 1024);
                const endUsage = process.cpuUsage(startUsage);
                const cpuTimeUsed = (endUsage.user + endUsage.system) / 1000; // Milliseconds

                try {
                    // --- Create Transaction Payload (Plaintext) ---
                    const method = contract.methods.multiplyData(
                        qosTypeValue,
                        qodModelValue,
                        qodOSVersionValue,
                        qosOperatorValue,
                        mosValue
                    );

                    // Calculate Transaction Size (based on encoded ABI)
                    const encodedAbi = method.encodeABI();
                    const transactionSizeBytes = web3.utils.hexToBytes(encodedAbi).length;
                    const transactionSizeKB = transactionSizeBytes / 1024;

                    // --- Estimate and Send Transaction ---
                    console.log("  Estimating gas...");
                    const gasEstimate = await method.estimateGas({ from: userAddress });
                    console.log(`  Estimated gas: ${gasEstimate}`);
                    
                    // Add a buffer to the gas estimate
                    const gasLimit = Math.ceil(Number(gasEstimate) * 1.2);
                    console.log(`  Sending transaction with gas limit: ${gasLimit}`);
                    
                    const gasPrice = await web3.eth.getGasPrice();
                    const adjustedGasPrice = BigInt(gasPrice) + BigInt(web3.utils.toWei("2", "gwei")); // Add 2 Gwei
                        
                    const transactionStartTime = Date.now();
                    
                    const receipt = await method.send({
                        from: userAddress,
                        gas: gasLimit,
                        gasPrice: adjustedGasPrice.toString(),
                    });
                    
                    const transactionConfirmationTime = (Date.now() - transactionStartTime) / 1000; // Seconds
                    const gasUsed = BigInt(receipt.gasUsed); // Ensure BigInt for calculation
                    const transactionCostWei = gasUsed * adjustedGasPrice;
                    const transactionCostEther = web3.utils.fromWei(transactionCostWei.toString(), 'ether');
                    
                    console.log(`  Transaction successful! Hash: ${receipt.transactionHash}`);
                    console.log(`  Actual gas used: ${gasUsed}`);
                    console.log(`  Transaction cost: ${transactionCostEther} ETH`);
                    console.log(`  Confirmation time: ${transactionConfirmationTime.toFixed(2)} s`);
                    
                    // --- Record Metrics ---
                    await csvWriter.writeRecords([
                        {
                            provider: provider_url,
                            rowNumber: i + 1,
                            transactionSize: transactionSizeKB.toFixed(2),
                            cpuUsage: cpuTimeUsed.toFixed(2),
                            memoryUsage: memoryUsage.toFixed(2),
                            transactionConfirmationTime: transactionConfirmationTime.toFixed(2),
                            transactionHash: receipt.transactionHash,
                            estimatedGas: gasEstimate.toString(),
                            actualGasUsed: gasUsed.toString(),
                            transactionCostEther: transactionCostEther  
                        },
                    ]);
                    
                    // Optional delay between transactions
                    // await new Promise(resolve => setTimeout(resolve, 500)); // e.g., 0.5 second delay

                } catch (error) {
                    console.error(`Error sending transaction for row ${i + 1}:`, error.message);
                    // Log more details for debugging if needed
                    if (error.receipt) {
                        console.error("  Transaction receipt:", error.receipt);
                    }
                    // Optionally write error to CSV or separate log
                    await csvWriter.writeRecords([
                         {
                            provider: provider_url,
                            rowNumber: i + 1,
                            transactionSize: 'ERROR',
                            cpuUsage: cpuTimeUsed.toFixed(2),
                            memoryUsage: memoryUsage.toFixed(2),
                            transactionConfirmationTime: 'ERROR',
                            transactionHash: 'ERROR - ' + error.message.substring(0, 100),
                            estimatedGas: 'ERROR',
                            actualGasUsed: 'ERROR',
                         }
                    ]);
                }
            }

            console.log("\nAll data processing finished.");

            // --- Optional: Final Check on Contract State ---
            try {
                const dataCount = await contract.methods.getDataCount().call();
                console.log("Final total number of entries in contract:", dataCount);

                // Optionally retrieve totals (these will be encrypted handles)
                // const totalMosHandle = await contract.methods.getTotalMOS().call();
                // console.log("Total MOS handle:", totalMosHandle); // Note: This is encrypted!
            } catch (finalCheckError) {
                console.error("Error performing final contract state check:", finalCheckError);
            }

        })
        .on('error', (error) => {
            console.error("Error reading CSV file:", error);
        });

} // end main

main().catch(console.error);
