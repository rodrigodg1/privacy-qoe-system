const { writeFileSync } = require('fs');
const { post } = require('axios');

async function runTest() {
  const results = { Low: [], Medium: [], High: [] };
  
  // Run load phases
  await runPhase(10, 'Low', results);
  await runPhase(50, 'Medium', results);
  await runPhase(100, 'High', results);

  // Generate rotated CSV
  const csvContent = [
    'Category,Time', // Header
    ...Object.entries(results)
      .flatMap(([category, times]) => 
        times.map(time => `${category},${time}`)
      )
  ].join('\n');

  writeFileSync('rotated_results.csv', csvContent);
  console.log('Rotated CSV created: rotated_results.csv');
}

async function runPhase(users, category, results) {
  const promises = [];
  for (let i = 0; i < users; i++) {
    promises.push(
      post('http://localhost:8585/encrypt', {
        QoS_type: 1,
        QoD_model: 2,
        QoD_os_version: 3,
        QoS_operator: 4,
        MOS: 5
      }).then(res => {
        if (res.data && typeof res.data.encryptionTime === 'number') {
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