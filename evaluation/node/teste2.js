const { createInstance } = require("fhevmjs");
const fs = require('fs');
const csv = require('csv-parser');


const createFhevmInstance = async () => {
  return createInstance({
    chainId: 11155111, // Sepolia chain ID
    kmsContractAddress: "0x9D6891A6240D6130c54ae243d8005063D05fE14b",
    aclContractAddress: "0xFee8407e2f5e3Ee68ad77cAE98c434e637f516e5",
    gatewayUrl: "https://gateway.sepolia.zama.ai",
    networkUrl: "https://eth-sepolia.public.blastapi.io",
  });
};



const results = [];

createFhevmInstance().then((instance) => {
  console.log(instance);

  const userAddress = "0xa5e1defb98EFe38EBb2D958CEe052410247F4c80";
  const contractAddress = "0xfCefe53c7012a075b8a711df391100d9c431c468";

    fs.createReadStream("pokemon_encoded.csv")
        .pipe(csv())
        .on("data", (data) => results.push(data))
        .on("end", async () => {
            console.log(`Finished reading CSV file. Total rows: ${results.length}`);

            for (let i = 0; i < results.length; i++) {
                const row = results[i];
                console.log(`Processing row ${i + 1}`);
                
                try {
                    // Create encrypted inputs for each field
                    const qosType_instance = instance.createEncryptedInput(contractAddress, userAddress);
                    const qodModel_instance = instance.createEncryptedInput(contractAddress, userAddress);
                    const qodOSVersion_instance = instance.createEncryptedInput(contractAddress, userAddress);
                    const qosOperator_instance = instance.createEncryptedInput(contractAddress, userAddress);
                    const mos_instance = instance.createEncryptedInput(contractAddress, userAddress);

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

                    const startTime = Date.now();
                    //const inputs =  qosType_instance.add8(parseInt(row.QoS_type)).encrypt();


                    // Encrypt each field
                    const { handles: qosTypeHandles, inputProof: qosTypeProof } = qosType_instance.add8(parseInt(row.QoS_type)).encrypt();
                    const { handles: qodModelHandles, inputProof: qodModelProof } = qodModel_instance.add8(parseInt(row.QoD_model)).encrypt();
                    const { handles: qodOSVersionHandles, inputProof: qodOSVersionProof } = qodOSVersion_instance.add8(parseInt(row["QoD_os-version"])).encrypt();
                    const { handles: qosOperatorHandles, inputProof: qosOperatorProof } = qosOperator_instance.add8(parseInt(row.QoS_operator)).encrypt();
                    const { handles: mosHandles, inputProof: mosProof } = mos_instance.add8(parseInt(row.MOS)).encrypt();


                    // Calculate encryption time
                    const encryptionTime = Date.now() - startTime;


                    console.log(`Row ${i + 1} processed successfully.`);
                    console.log(`Encryption Time All Items: ${encryptionTime} ms`);


                } catch (error) {
                    console.error(`Error processing row ${i + 1}:`, error.message);
                }
            }

            console.log("All rows processed.");
        })




});