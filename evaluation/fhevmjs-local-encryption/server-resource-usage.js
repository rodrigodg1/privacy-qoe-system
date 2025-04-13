const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const { createInstance, getPublicKeyCallParams } = require("fhevmjs");
const { ethers, JsonRpcProvider } = require("ethers");

const app = express();
app.use(bodyParser.json());

const provider = new JsonRpcProvider('http://localhost:8545');

const createFhevmInstance = async () => {
    const network = await provider.getNetwork();
    const chainId = +network.chainId.toString();
    const ret = await provider.call(getPublicKeyCallParams());
    const decoded = ethers.AbiCoder.defaultAbiCoder().decode(["bytes"], ret);
    const publicKey = decoded[0];
    return createInstance({ chainId, publicKey });
};

// CSV logging function
const csvFile = "performance_metrics_jmetter.csv";
function logMetrics(csvLine) {
    // If the CSV file doesn't exist, create it with a header row.
    if (!fs.existsSync(csvFile)) {
        fs.writeFileSync(csvFile, "requests,timestamp,encryptionTime_s,cpuUserDelta_s,cpuSystemDelta_s,rss_MB,heapTotal_MB,heapUsed_MB,external_MB\n");
    }
    fs.appendFileSync(csvFile, csvLine + "\n");
}

// Encryption endpoint with performance evaluation
app.post("/encrypt", async (req, res) => {
    const { Category, QoS_type, QoD_model, QoD_os_version, QoS_operator, MOS } = req.body;

    // Start time and metrics
    const startTime = Date.now();
    const startCpu = process.cpuUsage();
    const startMem = process.memoryUsage();

    try {
        const instance = await createFhevmInstance();

        // Encrypt each field
        const encrypted_QoS_Type = instance.encrypt8(parseInt(QoS_type));
        const encrypted_QoD_Model = instance.encrypt8(parseInt(QoD_model));
        const encrypted_QoD_OS_Version = instance.encrypt8(parseInt(QoD_os_version));
        const encrypted_QoS_Operator = instance.encrypt8(parseInt(QoS_operator));
        const encrypted_MOS = instance.encrypt8(parseInt(MOS));

        // Measure encryption time and usage differences
        const encryptionTime = Date.now() - startTime;
        const encryptionTimeSec = encryptionTime / 1000;
        const cpuDiff = process.cpuUsage(startCpu);
        // Convert microseconds to seconds
        const cpuUserSec = cpuDiff.user / 1000000;
        const cpuSystemSec = cpuDiff.system / 1000000;
        const endMem = process.memoryUsage();

        // Convert memory metrics from bytes to MB
        const rss_MB = endMem.rss / (1024 * 1024);
        const heapTotal_MB = endMem.heapTotal / (1024 * 1024);
        const heapUsed_MB = endMem.heapUsed / (1024 * 1024);
        const external_MB = endMem.external / (1024 * 1024);
        
        // Create CSV entry with current timestamp and measured metrics
        const timestamp = new Date().toISOString();
        const csvLine = `${Category},${timestamp},${encryptionTimeSec},${cpuUserSec},${cpuSystemSec},${rss_MB},${heapTotal_MB},${heapUsed_MB},${external_MB}`;
        logMetrics(csvLine);

        console.log(`Encryption time: ${encryptionTimeSec} s`);
        res.status(200).json({
            Category,
            encrypted_QoS_Type,
            encrypted_QoD_Model,
            encrypted_QoD_OS_Version,
            encrypted_QoS_Operator,
            encrypted_MOS,
            encryptionTime, // Include encryption time in the response
        });
    } catch (error) {
        console.error("Encryption error:", error.message);
        res.status(500).json({ error: "Encryption failed" });
    }
});

const PORT = 8585;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
