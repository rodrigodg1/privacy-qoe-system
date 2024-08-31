const fhevm = require("fhevmjs");
const Web3 = require("web3");
const fs = require("fs");
const csv = require("csv-parser");
const os = require('os');
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

function getEncryptedItemSize(handles, inputProof) {
    const encryptedStr = JSON.stringify(handles) + inputProof;
    const encryptedSizeBytes = Buffer.byteLength(encryptedStr, "utf8");
    return encryptedSizeBytes / 1024; // Convert to KB
}

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
    //const web3 = new Web3.default('http://localhost:8545');
    //const provider = "http://localhost:8545";
    //const provider_csv = "localhost";
    const provider = "https://devnet.zama.ai";
    const provider_csv = "devnet.zama.ai";
    

    const web3 = new Web3.default(provider);

    const privateKey_Zama_Dev = '0x3611d97e4794cd95dead683db1698b5b9d171f0c0ad4cbac2f8d88cc9ee591a5';
    const privateKey_local = '0x3611d97e4794cd95dead683db1698b5b9d171f0c0ad4cbac2f8d88cc9ee591a5';

    privateKey = privateKey_Zama_Dev;

    const contractAddress = "0x3e5d0097127bb71bba06bc28006e90d93a95a83d";


    const userAddress = "0x3b31fC0b4B81184078AFB1835810A6C732Fcd9E1";

    const account = web3.eth.accounts.privateKeyToAccount(privateKey);
    web3.eth.accounts.wallet.add(account);
    web3.eth.defaultAccount = account.address;

    const contractJson = JSON.parse(fs.readFileSync("./artifacts/examples/QoEEvaluator.sol/QoEEvaluator.json", "utf8"));
    const abi = contractJson.abi;
    const contract = new web3.eth.Contract(abi, contractAddress);

    const instance = await fhevm.createInstance({ networkUrl: "https://devnet.zama.ai" });

    

    const csvWriter = createCsvWriter({
        path: `performance_metrics_client_${provider_csv}.csv`,
        header: [
            { id: "provider", title: "provider" },
            { id: "rowNumber", title: "Row Number" },
            { id: "encryptionTime", title: "Encryption Time (ms)" },
            { id: "encryptedDataSize", title: "Encrypted Data Size (KB)" },
            { id: "transactionSize", title: "Transaction Size (KB)" },
            { id: "cpuUsage", title: "CPU Usage (%)" },
            { id: "memoryUsage", title: "Memory Usage (MB)" },
            { id: "transactionConfirmationTime", title: "Transaction Confirmation Time (s)" },
            { id: "transactionHash", title: "Transaction Hash" },
            { id: "estimatedGas", title: "Estimated Gas" },
            { id: "actualGasUsed", title: "Actual Gas Used" },
        ],
    });

    const results = [];
    fs.createReadStream("pokemon_encoded.csv")
        .pipe(csv())
        .on("data", (data) => results.push(data))
        .on("end", async () => {
            for (let i = 0; i < results.length; i++) {
                const row = results[i];
                console.log(`Processing row ${i + 1}`);

                const startTime = Date.now();
                const startCpu = getCpuUsage();
                const startMemUsage = process.memoryUsage().heapUsed;

                const qosType = instance.createEncryptedInput(contractAddress, userAddress);
                const qodModel = instance.createEncryptedInput(contractAddress, userAddress);
                const qodOSVersion = instance.createEncryptedInput(contractAddress, userAddress);
                const qosOperator = instance.createEncryptedInput(contractAddress, userAddress);
                const mos = instance.createEncryptedInput(contractAddress, userAddress);

                console.log(
                    "QoS Type:",
                    row.QoS_type,
                    "QoD Model:",
                    row.QoD_model,
                    "QoD OS Version:",
                    row["QoD_os-version"],
                    "QoS Operator:",
                    row.QoS_operator,
                    "MOS:",
                    row.MOS,
                );

                const { handles: qosTypeHandles, inputProof: qosTypeProof } = qosType.add8(parseInt(row.QoS_type)).encrypt();
                const { handles: qodModelHandles, inputProof: qodModelProof } = qodModel
                    .add8(parseInt(row.QoD_model))
                    .encrypt();
                const { handles: qodOSVersionHandles, inputProof: qodOSVersionProof } = qodOSVersion
                    .add8(parseInt(row["QoD_os-version"]))
                    .encrypt();
                const { handles: qosOperatorHandles, inputProof: qosOperatorProof } = qosOperator
                    .add8(parseInt(row.QoS_operator))
                    .encrypt();
                const { handles: mosHandles, inputProof: mosProof } = mos.add8(parseInt(row.MOS)).encrypt();



                const endMemUsage = process.memoryUsage().heapUsed;
                const memoryUsage = (endMemUsage - startMemUsage) / (1024 * 1024); // Convert to MB

                const encryptionTime = Date.now() - startTime;
                const endCpu = getCpuUsage();
                const cpuUsage = 100 * (1 - (endCpu.idle - startCpu.idle) / (endCpu.total - startCpu.total));


                // Calculate the total size of encrypted data
                const encryptedDataSize =
                    getEncryptedItemSize(qosTypeHandles, qosTypeProof) +
                    getEncryptedItemSize(qodModelHandles, qodModelProof) +
                    getEncryptedItemSize(qodOSVersionHandles, qodOSVersionProof) +
                    getEncryptedItemSize(qosOperatorHandles, qosOperatorProof) +
                    getEncryptedItemSize(mosHandles, mosProof);

                try {
                    const method = contract.methods.addData(
                        [qosTypeHandles[0], qosTypeProof],
                        [qodModelHandles[0], qodModelProof],
                        [qodOSVersionHandles[0], qodOSVersionProof],
                        [qosOperatorHandles[0], qosOperatorProof],
                        [mosHandles[0], mosProof],
                    );

                    const transactionSizeBytes = web3.utils.hexToBytes(method.encodeABI()).length;
                    const transactionSizeKB = transactionSizeBytes / 1024; // Convert to KB


                    const gasEstimate = await method.estimateGas({ from: account.address });
                    console.log(`Estimated gas: ${gasEstimate}`);
                
                    const gasLimit = Math.ceil(Number(gasEstimate) * 1.2);
                    console.log(`Gas limit with buffer: ${gasLimit}`);    
                
                    const transactionStartTime = Date.now();
                
                    const receipt = await method.send({
                        from: account.address,
                        gas: gasLimit,
                        gasPrice: web3.utils.toWei("20", "gwei"),
                    });
                
                    const transactionConfirmationTime = (Date.now() - transactionStartTime) / 1000; // Convert to seconds
                
                    const gasUsed = receipt.gasUsed;
                    console.log(`Actual gas used: ${gasUsed}`);
                
                    await csvWriter.writeRecords([
                        {
                            provider: provider,
                            rowNumber: i + 1,
                            encryptionTime: encryptionTime,
                            encryptedDataSize: encryptedDataSize.toFixed(2),
                            transactionSize: transactionSizeKB.toFixed(2),
                            cpuUsage: cpuUsage.toFixed(2),
                            memoryUsage: memoryUsage.toFixed(2),
                            transactionConfirmationTime: transactionConfirmationTime.toFixed(2),
                            transactionHash: receipt.transactionHash,
                            estimatedGas: gasEstimate.toString(), // Convert BigInt to string
                            actualGasUsed: gasUsed.toString(), // Convert BigInt to string
                        },
                    ]);
                
                    console.log(`Data entry ${i + 1} added successfully. Transaction hash: ${receipt.transactionHash}`);
                    console.log(`Transaction confirmation time: ${transactionConfirmationTime} seconds`);
                    console.log(`Estimated gas: ${gasEstimate}, Actual gas used: ${gasUsed}`);

                    // Wait for 2 seconds before processing the next data entry
                    await new Promise(resolve => setTimeout(resolve, 2000));

                } catch (error) {
                    console.error(`Error adding data entry ${i + 1}:`, error);
                }
            }

            console.log("All data processed");

            const dataCount = await contract.methods.getDataCount().call();
            console.log("Total number of entries:", dataCount);

            if (dataCount > 0) {
                const firstEntry = await contract.methods.getData(0).call();
                console.log("First entry:");
                console.log("  QoS Type:", firstEntry.qosType);
                console.log("  QoD Model:", firstEntry.qodModel);
                console.log("  QoD OS Version:", firstEntry.qodOSVersion);
                console.log("  QoS Operator:", firstEntry.qosOperator);
                console.log("  MOS:", firstEntry.mos);
            }
        });
}

main().catch(console.error);
