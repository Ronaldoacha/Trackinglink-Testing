#!/usr/bin/env node
/**
 * Extract test statistics from the HTML report for CI/CD reporting
 */

const fs = require('fs');
const path = require('path');

function extractTestStats() {
  const reportPath = path.join(process.cwd(), 'test-reports', 'latest-report.html');
  
  if (!fs.existsSync(reportPath)) {
    console.error('Report file not found:', reportPath);
    process.exit(1);
  }
  
  const htmlContent = fs.readFileSync(reportPath, 'utf8');
  
  // Extract statistics using regex patterns
  const patterns = {
    total: /<div class="summary-card total">[\s\S]*?<div class="number">(\d+)<\/div>/,
    passed: /<div class="summary-card success">[\s\S]*?<div class="number">(\d+)<\/div>/,
    failed: /<div class="summary-card failed">[\s\S]*?<div class="number">(\d+)<\/div>/,
    avgTime: /<div class="summary-card time">[\s\S]*?<div class="number">([\d.]+)s<\/div>/
  };
  
  const stats = {
    total: 0,
    passed: 0,
    failed: 0,
    avgTime: '0'
  };
  
  // Extract each statistic
  for (const [key, pattern] of Object.entries(patterns)) {
    const match = htmlContent.match(pattern);
    if (match && match[1]) {
      stats[key] = match[1];
    }
  }
  
  // Determine test status
  const testStatus = stats.failed > 0 ? 'FAILED' : (stats.total > 0 ? 'PASSED' : 'NO_TESTS');
  const statusIcon = stats.failed > 0 ? '❌' : (stats.total > 0 ? '✅' : '⚠️');
  const statusColor = stats.failed > 0 ? '#f8d7da' : (stats.total > 0 ? '#d4edda' : '#fff3cd');
  
  // Output in GitHub Actions format
  console.log(`total_tests=${stats.total}`);
  console.log(`passed_tests=${stats.passed}`);
  console.log(`failed_tests=${stats.failed}`);
  console.log(`avg_time=${stats.avgTime}`);
  console.log(`test_status=${testStatus}`);
  console.log(`status_icon=${statusIcon}`);
  console.log(`status_color=${statusColor}`);
}

try {
  extractTestStats();
} catch (error) {
  console.error('Error extracting test stats:', error.message);
  // Default values for error case
  console.log('total_tests=0');
  console.log('passed_tests=0');
  console.log('failed_tests=0');
  console.log('avg_time=0');
  console.log('test_status=ERROR');
  console.log('status_icon=⚠️');
  console.log('status_color=#fff3cd');
  process.exit(1);
}
