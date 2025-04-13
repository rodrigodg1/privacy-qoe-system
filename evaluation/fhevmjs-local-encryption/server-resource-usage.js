const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs").promises;
const { createInstance, getPublicKeyCallParams } = require("fhevmjs");
const { ethers, JsonRpcProvider } = require("ethers");

const app = express();
app.use(bodyParser.json());

const provider = new JsonRpcProvider("http://localhost:8545");

// Asynchronous function to get FHEVM instance
const createFhevmInstance = async () => {
    const network = await provider.getNetwork();
    const chainId = +network.chainId.toString();
    const ret = await provider.call(getPublicKeyCallParams());
    const decoded = ethers.AbiCoder.defaultAbiCoder().decode(["bytes"], ret);
    const publicKey = decoded[0];
    return createInstance({ chainId, publicKey });
};

// Ensure the file exists with headers
const csvFile = "performance_metrics_jmetter.csv";
const ensureCsvHeader = async () => {
    try {
        await fs.access(csvFile);
    } catch {
        const header = "requests,timestamp,encryptionTime_s,cpuUserDelta_s,cpuSystemDelta_s,rss_MB,heapTotal_MB,heapUsed_MB,external_MB\n";
        await fs.writeFile(csvFile, header);
    }
};

// Async write queue for performance metrics
const writeQueue = [];
let writing = false;

const flushWriteQueue = async () => {
    if (writing || writeQueue.length === 0) return;
    writing = true;
    const lines = writeQueue.splice(0, writeQueue.length).join("\n") + "\n";
    try {
        await fs.appendFile(csvFile, lines);
    } catch (err) {
        console.error("CSV append error:", err);
    }
    writing = false;
};

setInterval(flushWriteQueue, 100); // Flush queue every 100ms

// POST /encrypt endpoint
app.post("/encrypt", async (req, res) => {
    const { Category, QoS_type, QoD_model, QoD_os_version, QoS_operator, MOS } = req.body;

    const startTime = Date.now();
    const startCpu = process.cpuUsage();
    const startMem = process.memoryUsage();

    try {
        const instance = await createFhevmInstance();

        // Encrypt fields
        const encrypted_QoS_Type = instance.encrypt8(parseInt(QoS_type));
        const encrypted_QoD_Model = instance.encrypt8(parseInt(QoD_model));
        const encrypted_QoD_OS_Version = instance.encrypt8(parseInt(QoD_os_version));
        const encrypted_QoS_Operator = instance.encrypt8(parseInt(QoS_operator));
        const encrypted_MOS = instance.encrypt8(parseInt(MOS));

        const encryptionTimeSec = (Date.now() - startTime) / 1000;
        const cpuDiff = process.cpuUsage(startCpu);
        const cpuUserSec = cpuDiff.user / 1e6;
        const cpuSystemSec = cpuDiff.system / 1e6;
        const endMem = process.memoryUsage();
        const rss_MB = endMem.rss / (1024 * 1024);
        const heapTotal_MB = endMem.heapTotal / (1024 * 1024);
        const heapUsed_MB = endMem.heapUsed / (1024 * 1024);
        const external_MB = endMem.external / (1024 * 1024);

        const timestamp = new Date().toISOString();
        const csvLine = `${Category},${timestamp},${encryptionTimeSec},${cpuUserSec},${cpuSystemSec},${rss_MB},${heapTotal_MB},${heapUsed_MB},${external_MB}`;
        writeQueue.push(csvLine);

        res.status(200).json({
            Category,
            encrypted_QoS_Type,
            encrypted_QoD_Model,
            encrypted_QoD_OS_Version,
            encrypted_QoS_Operator,
            encrypted_MOS,
            encryptionTime: encryptionTimeSec,
        });
    } catch (error) {
        console.error("Encryption error:", error.message);
        res.status(500).json({ error: "Encryption failed" });
    }
});

const PORT = 8585;
ensureCsvHeader().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
});
