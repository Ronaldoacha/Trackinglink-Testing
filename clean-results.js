#!/usr/bin/env node

/**
 * Clean Test Results
 * Deletes all old test results and reports to start fresh
 * 
 * Usage: node clean-results.js
 * Or: npm run clean
 */

const fs = require('fs');
const path = require('path');

console.log('\n' + '='.repeat(70));
console.log('🧹 CLEAN TEST RESULTS');
console.log('='.repeat(70) + '\n');

const foldersToClean = [
  'allure-results',
  'test-results',
  'test-reports',
  'playwright-report',
  'allure-report'
];

async function cleanResults() {
  console.log('🗑️  Removing old test results and reports...\n');
  
  for (const folder of foldersToClean) {
    const folderPath = path.join(process.cwd(), folder);
    
    try {
      if (fs.existsSync(folderPath)) {
        // Count files before deleting
        const files = fs.readdirSync(folderPath);
        const fileCount = files.length;
        
        // Delete the folder
        await fs.promises.rm(folderPath, { recursive: true, force: true });
        
        console.log(`   ✅ Deleted: ${folder}/ (${fileCount} files removed)`);
      } else {
        console.log(`   ℹ️  Not found: ${folder}/ (nothing to delete)`);
      }
    } catch (error) {
      console.log(`   ❌ Error deleting ${folder}/: ${error.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('✅ Cleanup complete!');
  console.log('='.repeat(70));
  console.log('\n🚀 You can now run tests with: npm test');
  console.log('   Tests will generate fresh results.\n');
}

cleanResults().catch(error => {
  console.error('\n❌ Fatal error:', error.message);
  process.exit(1);
});
