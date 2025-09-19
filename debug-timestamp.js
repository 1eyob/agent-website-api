/**
 * Debug Script for Timestamp Issues
 * 
 * This script helps debug timing issues between link generation and validation
 */

const crypto = require('crypto');

const SECRET = 'a384b6463fc216a5f8ecb6670f86456a'; // Your secret

function debugTimestamp() {
  console.log("🔍 TIMESTAMP DEBUG ANALYSIS");
  console.log("=" .repeat(50));
  
  // Current time analysis
  const now = new Date();
  const currentTimeMs = Date.now();
  const currentTimeSeconds = Math.floor(currentTimeMs / 1000);
  
  console.log("📅 Current Time Analysis:");
  console.log("  - Date.now():", currentTimeMs);
  console.log("  - Math.floor(Date.now() / 1000):", currentTimeSeconds);
  console.log("  - new Date().toISOString():", now.toISOString());
  console.log("  - new Date().getTime():", now.getTime());
  console.log("  - process.env.TZ:", process.env.TZ || "not set");
  
  // Simulate link generation
  console.log("\n🔗 Simulating Link Generation:");
  const email = "test@example.com";
  const entityId = "entity123";
  const ts = currentTimeSeconds.toString();
  const hashData = `${email}|${ts}`;
  const token = crypto.createHmac('sha256', SECRET).update(hashData).digest('hex');
  
  console.log("  - email:", email);
  console.log("  - entityId:", entityId);
  console.log("  - ts:", ts);
  console.log("  - ts (readable):", new Date(parseInt(ts) * 1000).toISOString());
  console.log("  - hashData:", hashData);
  console.log("  - token:", token);
  
  // Simulate validation at different time intervals
  console.log("\n⏰ Simulating Validation at Different Times:");
  
  const intervals = [0, 30, 60, 150, 300, 350, 600];
  
  intervals.forEach(secondsLater => {
    const validationTime = currentTimeSeconds + secondsLater;
    const timeDifference = Math.abs(validationTime - parseInt(ts));
    const isValid = timeDifference <= 300;
    
    console.log(`\n  After ${secondsLater} seconds:`);
    console.log(`    - Validation time: ${validationTime}`);
    console.log(`    - Time difference: ${timeDifference} seconds`);
    console.log(`    - Valid (≤300s): ${isValid ? '✅' : '❌'}`);
    console.log(`    - Age: ${Math.floor(timeDifference / 60)}m ${timeDifference % 60}s`);
  });
  
  // Test with timestamps from different sources
  console.log("\n🌍 Testing Different Timestamp Sources:");
  
  const sources = [
    { name: "Date.now()", value: Math.floor(Date.now() / 1000) },
    { name: "new Date().getTime()", value: Math.floor(new Date().getTime() / 1000) },
    { name: "Math.floor(+new Date() / 1000)", value: Math.floor(+new Date() / 1000) }
  ];
  
  sources.forEach(source => {
    const diff = Math.abs(source.value - currentTimeSeconds);
    console.log(`  - ${source.name}: ${source.value} (diff: ${diff}s)`);
  });
  
  console.log("\n" + "=" .repeat(50));
  console.log("✅ Debug analysis complete");
}

// Run the debug
debugTimestamp();

// Export for use in other files
module.exports = { debugTimestamp };
