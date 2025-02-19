const fhevm = require('fhevmjs');
const fs = require('fs');
const Papa = require('papaparse');
const { performance } = require('perf_hooks'); // Using perf_hooks for better precision

async function encryptValue(instance, contractAddress, userAddress, value) {
    const input = instance.createEncryptedInput(contractAddress, userAddress);
    const startTime = performance.now();  // Start time measurement
    const encrypted = await input.add8(value).encrypt();
    const endTime = performance.now();  // End time measurement

    // Calculate encryption time in milliseconds
    const encryptionTime = endTime - startTime;

    // Convert encrypted value to a string if it's not already
    const encryptedStr = typeof encrypted === 'string' ? encrypted : JSON.stringify(encrypted);

    // Calculate size of encrypted value (in bytes)
    const encryptedSizeBytes = Buffer.byteLength(encryptedStr, 'utf8');

    // Convert size from bytes to kilobytes (KB)
    const encryptedSizeKB = encryptedSizeBytes / 1024;

    return { encrypted: encryptedStr, encryptionTime, encryptedSizeKB };
}

async function main() {
    try {
        // Create an instance of FHEVM with the specified network URL
        const instance = await fhevm.createInstance({ networkUrl: "http://localhost:8545" });
        console.log('Instance created:', instance);

        // Define contract and user addresses
        const contractAddress = '0x8Fdb26641d14a80FCCBE87BF455338Dd9C539a50';
        const userAddress = '0xa5e1defb98EFe38EBb2D958CEe052410247F4c80';

        // Read the CSV file
        const csvFile = fs.readFileSync('pokemon.csv', 'utf8');
        Papa.parse(csvFile, {
            header: true,
            complete: async (results) => {
                const encryptionTimes = [];

                // Process each row in the CSV file
                for (const row of results.data) {
                    const mosValue = parseFloat(row['MOS']); // Parse MOS value as a float
                    if (!isNaN(mosValue)) {
                        // Encrypt the value and measure encryption time
                        const { encrypted, encryptionTime, encryptedSizeKB } = await encryptValue(instance, contractAddress, userAddress, mosValue);

                        // Log the encrypted result and time taken
                        console.log(`Encrypted MOS value: ${encrypted}`);
                        console.log(`Encryption time: ${encryptionTime.toFixed(3)} ms`);
                        console.log(`Encrypted size: ${encryptedSizeKB.toFixed(3)} KB`);

                        // Store the encryption time and size along with the original value
                        encryptionTimes.push({ value: mosValue, encryptionTime: encryptionTime.toFixed(3), sizeKB: encryptedSizeKB.toFixed(3) });
                    }
                }

                // Convert encryption times to a CSV and save to file
                const csvHeader = 'value,EncryptionTime(ms),EncryptedSize(KB)\n';
                const csvRows = encryptionTimes.map(row => `${row.value},${row.encryptionTime},${row.sizeKB}`).join('\n');
                fs.writeFileSync('MOS_encryption_times.csv', csvHeader + csvRows);

                console.log('Encryption times saved to MOS_encryption_times.csv.');
            }
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

main();
