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

async function runTest() {
  const results = { '10': [], '50': [], '100': [] };
  const csvData = await loadCSVData();

  // Run load phases with CSV data
  await runPhase(10, '10', results, csvData);
  await runPhase(50, '50', results, csvData);
  await runPhase(100, '100', results, csvData);

  // Generate rotated CSV (fixed syntax)
  const csvContent = [
    'Category,Time',
    ...Object.entries(results)
      .flatMap(([category, times]) => 
        times.map(time => `${category},${time}`)
      )
  ].join('\n');

  writeFileSync('results_encryption.csv', csvContent);
  console.log('CSV created: results_encryption.csv');
}

async function runPhase(users, category, results, csvData) {
  const promises = [];
  for (let i = 0; i < users; i++) {
    const row = csvData[i % csvData.length];
    promises.push(
      post('http://localhost:8585/encrypt', {
        QoS_type: parseInt(row.QoS_type, 10),
        QoD_model: parseInt(row.QoD_model, 10),
        QoD_os_version: parseInt(row.QoD_os_version, 10),
        QoS_operator: parseInt(row.QoS_operator, 10),
        MOS: parseFloat(row.MOS)
      }).then(res => {
        if (res.data?.encryptionTime !== undefined) {
          results[category].push(res.data.encryptionTime);
        }
      }).catch(error => {
        console.error(`Error in ${category} phase:`, error.message);
      })
    );
  }
  await Promise.all(promises);
}

runTest().catch(console.error);