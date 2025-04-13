const { writeFileSync } = require('fs');
const { post } = require('axios');
const csv = require('csv-parser');
const fs = require('fs');

async function loadCSVData() {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream('pokemon_encoded.csv')
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}


// Helper function for delay (milliseconds)
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}



async function runTest() {
  //const results = { '10': [], '50': [], '100': [], '200': [] };
  const results = { '10': [], '50': [], '100': [] }; // Removed '200' for now
  const csvData = await loadCSVData();

// Run load phases with CSV data, including a 5-second delay between each phase.
await runPhase(10, '10', results, csvData);
await delay(30000);  // 5 seconds delay
await runPhase(50, '50', results, csvData);
await delay(30000);  // 5 seconds delay
await runPhase(100, '100', results, csvData);
// await delay(30000);  // 5 seconds delay
// await runPhase(200, '200', results, csvData);



  // Generate rotated CSV (fixed syntax)
  const csvContent = [
    'Category,Time',
    ...Object.entries(results)
      .flatMap(([category, times]) => 
        times.map(time => `${category},${time}`)
      )
  ].join('\n');

  writeFileSync('results_encryption2.csv', csvContent);
  console.log('CSV created: results_encryption2.csv');
}

async function runPhase(users, category, results, csvData) {
  const promises = [];
  for (let i = 0; i < users; i++) {
    const row = csvData[i % csvData.length];
    promises.push(
      post('http://localhost:8585/encrypt', {
        Category: category,
        QoS_type: parseInt(row.QoS_type),
        QoD_model: parseInt(row.QoD_model),
        QoD_os_version: parseInt(row.QoD_os_version),
        QoS_operator: parseInt(row.QoS_operator),
        MOS: parseFloat(row.MOS)
      }).then(res => {
        if (res.data?.encryptionTime !== undefined) {
          // Convert milliseconds to seconds
          const timeInSeconds = res.data.encryptionTime / 1000;
          results[category].push(timeInSeconds);
        }
      }).catch(error => {
        console.error(`Error in ${category} phase:`, error.message);
      })
    );
  }
  await Promise.all(promises);
}

runTest().catch(console.error);