const express = require("express");
const bodyParser = require("body-parser");
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

// Encryption endpoint
app.post("/encrypt", async (req, res) => {
    const { QoS_type, QoD_model, QoD_os_version, QoS_operator, MOS } = req.body;

    const startTime = Date.now(); // Start measuring encryption time

    try {
        const instance = await createFhevmInstance();

        // Encrypt each field
        const encrypted_QoS_Type = instance.encrypt8(parseInt(QoS_type));
        const encrypted_QoD_Model = instance.encrypt8(parseInt(QoD_model));
        const encrypted_QoD_OS_Version = instance.encrypt8(parseInt(QoD_os_version));
        const encrypted_QoS_Operator = instance.encrypt8(parseInt(QoS_operator));
        const encrypted_MOS = instance.encrypt8(parseInt(MOS));

        const encryptionTime = Date.now() - startTime; // Calculate encryption time

        console.log(`Encryption time: ${encryptionTime} ms`); // Log encryption time

        res.status(200).json({
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