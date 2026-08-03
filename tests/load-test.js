/**
 * Programmatic Load Benchmark Script for CampusConnect Pro
 */
const http = require('http');

const TARGET_URL = process.env.TARGET_URL || 'http://localhost:3000/health';
const TOTAL_REQUESTS = parseInt(process.env.TOTAL_REQUESTS || '100', 10);
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '10', 10);

console.log(`Starting Load Benchmark: ${TOTAL_REQUESTS} requests on ${TARGET_URL} (Concurrency: ${CONCURRENCY})`);

let completed = 0;
let successCount = 0;
let failCount = 0;
const startTime = Date.now();

const sendRequest = () => {
  return new Promise((resolve) => {
    const req = http.get(TARGET_URL, (res) => {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        successCount++;
      } else {
        failCount++;
      }
      res.resume();
      resolve();
    });

    req.on('error', () => {
      failCount++;
      resolve();
    });
  });
};

const runBenchmark = async () => {
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (completed < TOTAL_REQUESTS) {
      completed++;
      await sendRequest();
    }
  });

  await Promise.all(workers);

  const durationMs = Date.now() - startTime;
  const rps = ((TOTAL_REQUESTS / durationMs) * 1000).toFixed(2);

  console.log('\n======================================');
  console.log('🚀 Load Benchmark Complete');
  console.log(`⏱️ Duration     : ${durationMs} ms`);
  console.log(`✅ Successful   : ${successCount}`);
  console.log(`❌ Failed       : ${failCount}`);
  console.log(`⚡ Throughput   : ${rps} req/sec`);
  console.log('======================================\n');
};

runBenchmark();
