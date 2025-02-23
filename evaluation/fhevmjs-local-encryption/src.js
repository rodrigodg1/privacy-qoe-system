const { createInstance, getPublicKeyCallParams } = require("fhevmjs");
const { ethers, JsonRpcProvider } = require("ethers");
const fs = require("fs");
const csv = require("csv-parser");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

// Initialize provider and create FHEVM instance
const provider = new JsonRpcProvider('http://localhost:8545');

const createFhevmInstance = async () => {
    // 1. Get the chain id
    const network = await provider.getNetwork();
    const chainId = +network.chainId.toString();
    // 2. Fetch the FHE public key from the blockchain
    const ret = await provider.call(getPublicKeyCallParams());
    const decoded = ethers.AbiCoder.defaultAbiCoder().decode(["bytes"], ret);
    const publicKey = decoded[0];

    // 3. Create the instance
    return createInstance({ chainId, publicKey });
};

// Function to get CPU usage (you may need to implement this based on your environment)
function getCpuUsage() {
    // Placeholder for CPU usage tracking logic
    return { idle: 0, total: 0 };
}

// Function to calculate the size of encrypted items
function getEncryptedItemSize(handles, proof) {
    return JSON.stringify(handles).length + JSON.stringify(proof).length;
}

// CSV writer setup
const csvWriter = createCsvWriter({
    path: "encryption_results.csv",
    header: [
        { id: "row", title: "Row" },
        { id: "QoS_type", title: "QoS Type" },
        { id: "QoD_model", title: "QoD Model" },
        { id: "QoD_os-version", title: "QoD OS Version" },
        { id: "QoS_operator", title: "QoS Operator" },
        { id: "MOS", title: "MOS" },
        { id: "encryptionTime", title: "Encryption Time (ms)" },
    ],
});

// Main execution
(async () => {
    const instance = await createFhevmInstance();
    console.log("FHEVM instance created:", instance);

    const results = [];
    const encryptionResults = [];

    fs.createReadStream("pokemon_encoded.csv")
        .pipe(csv())
        .on("data", (data) => results.push(data))
        .on("end", async () => {
            console.log(`Finished reading CSV file. Total rows: ${results.length}`);

            for (let i = 0; i < 21; i++) {
                const row = results[i];
                console.log(`Processing row ${i + 1}`);

                const startTime = Date.now();
                const startCpu = getCpuUsage();
                const startMemUsage = process.memoryUsage().heapUsed;

                try {
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

                    const qosType_instance = await createFhevmInstance();
                    const qodModel_instance = await createFhevmInstance();
                    const qodOsVersion_instance = await createFhevmInstance();
                    const qosOperator_instance = await createFhevmInstance();
                    const mos_instance = await createFhevmInstance();

                    // Encrypt each field
                    const encrypted_QoS_Type = qosType_instance.encrypt8(parseInt(row.QoS_type));
                    const encrypted_QoD_Model = qodModel_instance.encrypt8(parseInt(row.QoD_model));
                    const encrypted_QoD_OS_Version = qodOsVersion_instance.encrypt8(parseInt(row["QoD_os-version"]));
                    const encrypted_QoS_Operator = qosOperator_instance.encrypt8(parseInt(row.QoS_operator));
                    const encrypted_MOS = mos_instance.encrypt8(parseInt(row.MOS));

                    // Calculate encryption time
                    const encryptionTime = Date.now() - startTime;

                    // Store results for this row
                    encryptionResults.push({
                        row: i + 1,
                        QoS_type: row.QoS_type,
                        QoD_model: row.QoD_model,
                        "QoD_os-version": row["QoD_os-version"],
                        QoS_operator: row.QoS_operator,
                        MOS: row.MOS,
                        encryptionTime: encryptionTime,
                    });

                    console.log(`Row ${i + 1} processed successfully.`);
                    console.log(`Encryption Time: ${encryptionTime} ms`);

                } catch (error) {
                    console.error(`Error processing row ${i + 1}:`, error.message);
                }
            }

            // Write encryption results to CSV
            await csvWriter.writeRecords(encryptionResults);
            console.log("Encryption results saved to encryption_results.csv");

            console.log("All rows processed.");
        })
        .on("error", (error) => {
            console.error("Error reading CSV file:", error.message);
        });
})();