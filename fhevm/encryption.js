const fhevm = require('fhevmjs');
const fs = require('fs');
const Papa = require('papaparse');
const { performance } = require('perf_hooks');


async function encryptValue(instance, contractAddress, userAddress, value) {
    if (typeof value !== 'number' || isNaN(value)) {
        throw new Error('Value must be a valid number or a bigint.');
    }

    const input = instance.createEncryptedInput(contractAddress, userAddress);
    const startTime = performance.now();
    const encrypted = await input.add8(value).encrypt();
    const endTime = performance.now();

    const encryptionTime = endTime - startTime;
    const encryptedStr = typeof encrypted === 'string' ? encrypted : JSON.stringify(encrypted);
    const encryptedSizeBytes = Buffer.byteLength(encryptedStr, 'utf8');
    const encryptedSizeKB = encryptedSizeBytes / 1024;

    return { encrypted: encryptedStr, encryptionTime, encryptedSizeKB };
}

async function main() {
    try {
        const instance = await fhevm.createInstance({ networkUrl: "http://localhost:8545" });
        console.log('Instance created:', instance);

        const contractAddress = '0x8Fdb26641d14a80FCCBE87BF455338Dd9C539a50';
        const userAddress = '0xa5e1defb98EFe38EBb2D958CEe052410247F4c80';

        const csvFile = fs.readFileSync('pokemon_encoded.csv', 'utf8');
        Papa.parse(csvFile, {
            header: true,
            complete: async (results) => {
                const columns = ['QoS_type', 'QoD_model', 'QoD_os-version', 'QoS_operator', 'MOS'];
                const encryptionResults = [];

                for (const row of results.data) {
                    const rowResult = { };

                    for (const column of columns) {
                        let value = row[column];

                        // Parse only specific columns as numbers
                        if (['QoS_type', 'QoS_operator', 'MOS'].includes(column)) {
                            value = parseFloat(value);
                        } else {
                            value = Number(value);
                        }

                        // Check if value is valid before proceeding with encryption
                        if (!isNaN(value)) {
                            try {
                                const { encrypted, encryptionTime, encryptedSizeKB } = await encryptValue(instance, contractAddress, userAddress, value);
                                
                                console.log(`Encrypted ${column} value: ${encrypted}`);
                                console.log(`Encryption time: ${encryptionTime.toFixed(3)} ms`);
                                console.log(`Encrypted size: ${encryptedSizeKB.toFixed(3)} KB`);

                                rowResult[column] = value;
                                rowResult[`${column}_EncryptionTime(ms)`] = encryptionTime.toFixed(3);
                                rowResult[`${column}_EncryptedSize(KB)`] = encryptedSizeKB.toFixed(3);
                            } catch (error) {
                                console.error(`Error encrypting ${column} value:`, value, error.message);
                                rowResult[column] = 'Error';
                                rowResult[`${column}_EncryptionTime(ms)`] = 'Error';
                                rowResult[`${column}_EncryptedSize(KB)`] = 'Error';
                            }
                        } else {
                            console.warn(`Skipping invalid value for ${column}:`, row[column]);
                            rowResult[column] = 'Invalid';
                            rowResult[`${column}_EncryptionTime(ms)`] = 'Invalid';
                            rowResult[`${column}_EncryptedSize(KB)`] = 'Invalid';
                        }
                    }

                    encryptionResults.push(rowResult);
                }

                // Combine results into a single CSV file
                const csvHeader = Object.keys(encryptionResults[0]).join(',') + '\n';
                const csvRows = encryptionResults.map(row => Object.values(row).join(',')).join('\n');
                const finalCsvContent = csvHeader + csvRows;
                
                fs.writeFileSync('combined_encryption_results.csv', finalCsvContent);
                console.log('All encryption times saved to combined_encryption_results.csv.');
            }
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

main();
