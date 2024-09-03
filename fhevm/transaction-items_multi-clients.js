const fhevm = require("fhevmjs");
const Web3 = require("web3");
const fs = require("fs");
const csv = require("csv-parser");
const os = require('os');
const createCsvWriter = require("csv-writer").createObjectCsvWriter;



function bigIntReplacer(key, value) {
    if (typeof value === 'bigint') {
        return value.toString();
    }
    return value;
}



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

class NonceManager {
    constructor(web3, account) {
        this.web3 = web3;
        this.account = account;
        this.nonce = null;
    }

    async initialize() {
        this.nonce = BigInt(await this.web3.eth.getTransactionCount(this.account.address));
    }

    getNonce() {
        if (this.nonce === null) {
            throw new Error("NonceManager not initialized");
        }
        const currentNonce = this.nonce;
        this.nonce = this.nonce + BigInt(1);
        return currentNonce;
    }
}

async function createAccounts(web3, numAccounts) {
    const accounts = [];
    for (let i = 0; i < numAccounts; i++) {
        const account = web3.eth.accounts.create();
        accounts.push(account);
    }
    return accounts;
}

async function distributeFunds(web3, mainAccount, accounts, amount) {
    const mainNonceManager = new NonceManager(web3, mainAccount);
    await mainNonceManager.initialize();

    for (const account of accounts) {
        const nonce = mainNonceManager.getNonce();
        const tx = {
            from: mainAccount.address,
            to: account.address,
            value: web3.utils.toWei(amount.toString(), 'ether'),
            gas: 21000,
            gasPrice: await web3.eth.getGasPrice(),
            nonce: nonce.toString()
        };
        const signedTx = await mainAccount.signTransaction(tx);
        try {
            const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
            console.log(`Distributed ${amount} ETH to ${account.address}. Transaction hash: ${receipt.transactionHash}`);
        } catch (error) {
            console.error(`Failed to distribute funds to ${account.address}:`, error);
        }
    }
}

async function processUserTransaction(userData, userIndex, instance, contract, web3, account, csvWriter, nonceManager) {
    console.log(`Processing data for user ${userIndex + 1}`);

    const startTime = Date.now();
    const startUsage = process.cpuUsage();
    const startMemUsage = process.memoryUsage().heapUsed;

    const qosType = instance.createEncryptedInput(contract.options.address, account.address);
    const qodModel = instance.createEncryptedInput(contract.options.address, account.address);
    const qodOSVersion = instance.createEncryptedInput(contract.options.address, account.address);
    const qosOperator = instance.createEncryptedInput(contract.options.address, account.address);
    const mos = instance.createEncryptedInput(contract.options.address, account.address);

    console.log(
        "QoS Type:",
        userData.QoS_type,
        "QoD Model:",
        userData.QoD_model,
        "QoD OS Version:",
        userData["QoD_os-version"],
        "QoS Operator:",
        userData.QoS_operator,
        "MOS:",
        userData.MOS,
    );

    const { handles: qosTypeHandles, inputProof: qosTypeProof } = qosType.add8(parseInt(userData.QoS_type)).encrypt();
    const { handles: qodModelHandles, inputProof: qodModelProof } = qodModel.add8(parseInt(userData.QoD_model)).encrypt();
    const { handles: qodOSVersionHandles, inputProof: qodOSVersionProof } = qodOSVersion.add8(parseInt(userData["QoD_os-version"])).encrypt();
    const { handles: qosOperatorHandles, inputProof: qosOperatorProof } = qosOperator.add8(parseInt(userData.QoS_operator)).encrypt();
    const { handles: mosHandles, inputProof: mosProof } = mos.add8(parseInt(userData.MOS)).encrypt();

    const endMemUsage = process.memoryUsage().heapUsed;
    const memoryUsage = (endMemUsage - startMemUsage) / (1024 * 1024); // Convert to MB

    const encryptionTime = Date.now() - startTime;
    const endUsage = process.cpuUsage(startUsage);
    const cpuTimeUsed = (endUsage.user + endUsage.system) / 1000;

    const encryptedDataSize =
        getEncryptedItemSize(qosTypeHandles, qosTypeProof) +
        getEncryptedItemSize(qodModelHandles, qodModelProof) +
        getEncryptedItemSize(qodOSVersionHandles, qodOSVersionProof) +
        getEncryptedItemSize(qosOperatorHandles, qosOperatorProof) +
        getEncryptedItemSize(mosHandles, mosProof);

        const maxRetries = 5;
        let currentRetry = 0;
    
        while (currentRetry < maxRetries) {
            try {
                const nonce = nonceManager.getNonce();
    
                const method = contract.methods.addData(
                    [qosTypeHandles[0], qosTypeProof],
                    [qodModelHandles[0], qodModelProof],
                    [qodOSVersionHandles[0], qodOSVersionProof],
                    [qosOperatorHandles[0], qosOperatorProof],
                    [mosHandles[0], mosProof]
                );
    
                const transactionSizeBytes = web3.utils.hexToBytes(method.encodeABI()).length;
                const transactionSizeKB = transactionSizeBytes / 1024; // Convert to KB
    
                const gasEstimate = await method.estimateGas({ from: account.address });
                const gasLimit = Math.ceil(Number(gasEstimate) * 1.5); // Increased gas limit
    
                const transactionStartTime = Date.now();
    
                const tx = {
                    from: account.address,
                    to: contract.options.address,
                    gas: gasLimit,
                    gasPrice: await web3.eth.getGasPrice(),
                    nonce: nonce.toString(),
                    data: method.encodeABI()
                };
    
                console.log(`Sending transaction for user ${userIndex + 1}:`, JSON.stringify(tx, bigIntReplacer, 2));
    
                const signedTx = await account.signTransaction(tx);
                const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    
                const transactionConfirmationTime = (Date.now() - transactionStartTime) / 1000;
    
                await csvWriter.writeRecords([
                    {
                        userId: userIndex + 1,
                        encryptionTime: encryptionTime,
                        encryptedDataSize: encryptedDataSize.toFixed(2),
                        transactionSize: transactionSizeKB.toFixed(2),
                        cpuUsage: cpuTimeUsed.toFixed(2),
                        memoryUsage: memoryUsage.toFixed(2),
                        transactionConfirmationTime: transactionConfirmationTime.toFixed(2),
                        transactionHash: receipt.transactionHash,
                        estimatedGas: gasEstimate.toString(),
                        actualGasUsed: receipt.gasUsed.toString(),
                    },
                ]);
    
                console.log(`Data entry for user ${userIndex + 1} added successfully. Transaction hash: ${receipt.transactionHash}`);
                return;
            } catch (error) {
                console.error(`Error adding data entry for user ${userIndex + 1} (Attempt ${currentRetry + 1}):`, error);
                if (error.receipt) {
                    console.error("Transaction receipt:", JSON.stringify(error.receipt, bigIntReplacer, 2));
                }
                currentRetry++;
                if (currentRetry >= maxRetries) {
                    console.error(`Max retries reached for user ${userIndex + 1}. Aborting.`);
                    return;
                } else {
                    console.log(`Retrying for user ${userIndex + 1}...`);
                    await new Promise(resolve => setTimeout(resolve, 1000 * currentRetry)); // Exponential backoff
                }
            }
        }
    }
    
    async function main() {
        const provider = "http://localhost:8545";
        const web3 = new Web3.default(provider);
    
        const privateKey = '0x8355bb293b8714a06b972bfe692d1bd9f24235c1f4007ae0be285d398b0bba2f';
        const contractAddress = "0x8fdb26641d14a80fccbe87bf455338dd9c539a50";
    
        const mainAccount = web3.eth.accounts.privateKeyToAccount(privateKey);
        web3.eth.accounts.wallet.add(mainAccount);
        web3.eth.defaultAccount = mainAccount.address;
    
        const contractJson = JSON.parse(fs.readFileSync("./artifacts/examples/QoEEvaluatorITEMS.sol/QoEEvaluatorITEMS.json", "utf8"));
        const contract = new web3.eth.Contract(contractJson.abi, contractAddress);
    
        const instance = await fhevm.createInstance({ networkUrl: provider });
    
        const numUsers = 2; // Set the number of concurrent users
        const accounts = await createAccounts(web3, numUsers);
        
        console.log("Distributing funds to new accounts...");
        await distributeFunds(web3, mainAccount, accounts, 0.5); // Distribute 1 ETH to each account
        console.log("Funds distributed successfully.");
    
        const csvWriter = createCsvWriter({
            path: `parallel_multi_user_performance_metrics_${numUsers}_users.csv`,
            header: [
                { id: "userId", title: "User ID" },
                { id: "encryptionTime", title: "Encryption Time (ms)" },
                { id: "encryptedDataSize", title: "Encrypted Data Size (KB)" },
                { id: "transactionSize", title: "Transaction Size (KB)" },
                { id: "cpuUsage", title: "CPU Usage (ms)" },
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
                const transactionPromises = results.slice(0, numUsers).map((userData, index) => {
                    const account = accounts[index];
                    const nonceManager = new NonceManager(web3, account);
                    return nonceManager.initialize().then(() => 
                        processUserTransaction(userData, index, instance, contract, web3, account, csvWriter, nonceManager)
                    );
                });
    
                await Promise.all(transactionPromises);
    
                console.log(`All transactions for ${numUsers} users processed`);
    
                const dataCount = await contract.methods.getDataCount().call();
                console.log("Total number of entries:", dataCount);
            });
    }
    
    main().catch(console.error);