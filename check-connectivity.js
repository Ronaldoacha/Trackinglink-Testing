/**
 * Quick Connectivity Check
 * Run this FIRST to verify the test page is accessible
 * 
 * Usage: node check-connectivity.js
 */

const { chromium } = require('playwright');
require('dotenv').config();

const CONFIG = {
  testWebsite: process.env.TEST_WEBSITE || 'https://sp.athena-stageworker.xyz',
  testPagePath: process.env.TEST_PAGE_NAME || 'apitl-tests',
  cfClientId: process.env.CF_ACCESS_CLIENT_ID_STAGING || '58c14a350fb83681fbe8056ebf70bbac.access',
  cfClientSecret: process.env.CF_ACCESS_CLIENT_SECRET_STAGING
};

async function checkConnectivity() {
  console.log('\n' + '='.repeat(80));
  console.log('🌐 CONNECTIVITY CHECK');
  console.log('='.repeat(80));
  
  const testUrl = `${CONFIG.testWebsite}/${CONFIG.testPagePath}`;
  console.log(`📍 Testing URL: ${testUrl}`);
  console.log('='.repeat(80) + '\n');

  console.log('🚀 Launching browser...');
  const browser = await chromium.launch({ 
    headless: true,
    timeout: 30000 
  });
  
  console.log('✅ Browser launched\n');
  
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    timeout: 60000
  });
  
  // Set Cloudflare Access headers if needed
  if (CONFIG.cfClientId && CONFIG.cfClientSecret) {
    console.log('🔑 Setting Cloudflare Access credentials...');
    await context.setExtraHTTPHeaders({
      'CF-Access-Client-Id': CONFIG.cfClientId,
      'CF-Access-Client-Secret': CONFIG.cfClientSecret
    });
    console.log('✅ Credentials set\n');
  } else {
    console.log('⚠️  No Cloudflare Access credentials found in .env\n');
  }
  
  const page = await context.newPage();
  
  console.log('📡 Attempting to connect to page...');
  console.log('⏳ This may take up to 60 seconds...\n');
  
  try {
    const startTime = Date.now();
    
    const response = await page.goto(testUrl, { 
      waitUntil: 'commit', // Just wait for navigation to commit, not full load
      timeout: 60000
    });
    
    const loadTime = Date.now() - startTime;
    
    console.log('='.repeat(80));
    console.log('✅ CONNECTION SUCCESSFUL!');
    console.log('='.repeat(80));
    console.log(`📊 Status Code: ${response.status()}`);
    console.log(`📊 Status Text: ${response.statusText()}`);
    console.log(`⏱️  Load Time: ${loadTime}ms`);
    console.log(`🌐 Final URL: ${page.url()}`);
    console.log('='.repeat(80) + '\n');
    
    if (response.status() >= 400) {
      console.log('⚠️  WARNING: HTTP error status detected!');
      console.log(`   Status ${response.status()} indicates the page may not exist or is not accessible.\n`);
      await browser.close();
      process.exit(1);
    }
    
    // Try to wait for page to be ready
    console.log('⏳ Waiting for page to be ready...');
    try {
      await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
      console.log('✅ DOM content loaded\n');
    } catch (domError) {
      console.log('⚠️  DOM load timeout, but connection established\n');
    }
    
    // Check for any obvious error messages on the page
    const pageTitle = await page.title();
    console.log(`📄 Page Title: "${pageTitle}"\n`);
    
    // Take a screenshot for verification
    try {
      await page.screenshot({ 
        path: 'test-results/connectivity-check.png',
        fullPage: false 
      });
      console.log('📸 Screenshot saved: test-results/connectivity-check.png\n');
    } catch (screenshotError) {
      console.log('⚠️  Could not save screenshot\n');
    }
    
    console.log('='.repeat(80));
    console.log('✅ ✅ ✅ CONNECTIVITY CHECK PASSED!');
    console.log('='.repeat(80));
    console.log('🎯 The test page is accessible.');
    console.log('🚀 You can proceed with: npm run validate\n');
    
    await browser.close();
    process.exit(0);
    
  } catch (error) {
    console.log('='.repeat(80));
    console.log('❌ CONNECTION FAILED');
    console.log('='.repeat(80));
    console.log(`Error: ${error.message}\n`);
    
    console.log('💡 TROUBLESHOOTING STEPS:\n');
    console.log('1. Verify the URL is correct:');
    console.log(`   ${testUrl}`);
    console.log('   Try opening this in your browser manually.\n');
    
    console.log('2. Check your network connection:');
    console.log('   - Are you connected to the internet?');
    console.log('   - Can you access other websites?\n');
    
    console.log('3. Verify Cloudflare Access credentials:');
    console.log('   - Check .env file has CF_ACCESS_CLIENT_ID_STAGING');
    console.log('   - Check .env file has CF_ACCESS_CLIENT_SECRET_STAGING');
    console.log(`   - Current ClientId: ${CONFIG.cfClientId ? '✅ Set' : '❌ Missing'}`);
    console.log(`   - Current Secret: ${CONFIG.cfClientSecret ? '✅ Set' : '❌ Missing'}\n`);
    
    console.log('4. Try accessing the page in your browser:');
    console.log(`   ${testUrl}`);
    console.log('   If it loads in your browser but not in the script, it may be a Cloudflare issue.\n');
    
    console.log('5. Check if the page exists:');
    console.log('   - Login to WordPress admin');
    console.log('   - Go to Pages and verify "APITL Tests" page exists');
    console.log('   - Verify the page is published (not draft)\n');
    
    console.log('6. Firewall/VPN:');
    console.log('   - Check if your firewall is blocking Playwright');
    console.log('   - Try disabling VPN if you have one active\n');
    
    await browser.close();
    process.exit(1);
  }
}

// Run connectivity check
checkConnectivity().catch(error => {
  console.error('\n❌ Fatal error:', error.message);
  console.error('Stack trace:', error.stack);
  process.exit(1);
});
