/**
 * Quick Validation Script - Run BEFORE executing tests
 * This script verifies that all widgets are present on the test page
 * 
 * Usage: node validate-widgets.js
 */

const { chromium } = require('playwright');
require('dotenv').config();

const CONFIG = {
  testWebsite: process.env.TEST_WEBSITE || 'https://sp.athena-stageworker.xyz',
  testPagePath: process.env.TEST_PAGE_NAME || 'apitl-tests',
  cfClientId: process.env.CF_ACCESS_CLIENT_ID_STAGING || '58c14a350fb83681fbe8056ebf70bbac.access',
  cfClientSecret: process.env.CF_ACCESS_CLIENT_SECRET_STAGING
};

const EXPECTED_WIDGETS = [
  'test-r01', 'test-r02', 'test-r03', 'test-r04',
  'test-r10', 'test-r11', 'test-r14',
  'test-sent-01', 'test-sent-02', 'test-sent-03',
  'test-perf-01', 'test-perf-02', 'test-perf-03'
];

async function validateWidgets() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 WIDGET VALIDATION - Pre-Test Check');
  console.log('='.repeat(80));
  console.log(`📍 Test URL: ${CONFIG.testWebsite}/${CONFIG.testPagePath}`);
  console.log(`📋 Expected Widgets: ${EXPECTED_WIDGETS.length}`);
  console.log('='.repeat(80) + '\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  
  // Set Cloudflare Access headers if needed
  if (CONFIG.cfClientId && CONFIG.cfClientSecret) {
    await context.setExtraHTTPHeaders({
      'CF-Access-Client-Id': CONFIG.cfClientId,
      'CF-Access-Client-Secret': CONFIG.cfClientSecret
    });
  }
  
  const page = await context.newPage();
  
  try {
    console.log('🌐 Loading page...');
    const testUrl = `${CONFIG.testWebsite}/${CONFIG.testPagePath}`;
    console.log('⏳ Attempting to load (may take up to 60 seconds)...');
    console.log('   If this times out, check your network connection and page URL.\n');
    
    let response;
    try {
      response = await page.goto(testUrl, { 
        waitUntil: 'domcontentloaded', // Changed from networkidle to be more lenient
        timeout: 60000  // Increased to 60 seconds
      });
    } catch (navError) {
      console.log(`❌ Navigation Error: ${navError.message}`);
      console.log('\n💡 Troubleshooting Tips:');
      console.log('   1. Check if page exists: Open in browser manually');
      console.log('   2. Check network connection');
      console.log('   3. Verify Cloudflare Access credentials in .env file');
      console.log(`   4. Try accessing directly: ${testUrl}\n`);
      await browser.close();
      process.exit(1);
    }
    
    if (response.status() >= 400) {
      console.log(`❌ ERROR: Page returned status ${response.status()}`);
      console.log('   Please verify the page exists and is accessible.\n');
      await browser.close();
      process.exit(1);
    }
    
    console.log(`✅ Page loaded (Status: ${response.status()})`);
    
    // Wait for DOM and widgets to render
    await page.waitForLoadState('domcontentloaded');
    console.log('✅ DOM loaded');
    
    // Try to wait for network idle but don't fail if it doesn't settle
    try {
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      console.log('✅ Network idle');
    } catch {
      console.log('⚠️ Network still active, but continuing...');
    }
    
    await page.waitForTimeout(5000); // Increased wait time for widgets to render
    console.log('✅ Waited 5 seconds for widget rendering\n');
    
    // Check for widgets
    const widgetSelector = '[datatlid^="test-"]';
    console.log(`🔍 Checking for widgets with selector: ${widgetSelector}\n`);
    const widgetCount = await page.locator(widgetSelector).count();
    
    console.log('='.repeat(80));
    console.log('📊 VALIDATION RESULTS');
    console.log('='.repeat(80));
    console.log(`🔢 Widgets Found: ${widgetCount}`);
    console.log(`🔢 Widgets Expected: ${EXPECTED_WIDGETS.length}`);
    console.log(`${widgetCount === EXPECTED_WIDGETS.length ? '✅' : '❌'} Widget Count: ${widgetCount === EXPECTED_WIDGETS.length ? 'CORRECT' : 'INCORRECT'}\n`);
    
    // Print all datatlid values found in DOM
    if (widgetCount > 0) {
      console.log('📋 All widgets found in DOM with datatlid attribute:');
      const allFoundWidgets = await page.locator(widgetSelector).all();
      for (let i = 0; i < allFoundWidgets.length; i++) {
        const widgetDataTlid = await allFoundWidgets[i].getAttribute('datatlid');
        const widgetId = await allFoundWidgets[i].getAttribute('id');
        console.log(`   ${i + 1}. datatlid="${widgetDataTlid}", id="${widgetId}"`);
      }
      console.log('');
    }
    
    if (widgetCount === 0) {
      console.log('❌ CRITICAL ERROR: NO WIDGETS FOUND ON PAGE!');
      console.log('   Tests cannot run without widgets.');
      console.log('   Please add all widget shortcodes from tests-blocks.md to the WordPress page.\n');
      await browser.close();
      process.exit(1);
    }
    
    // Check each expected widget
    console.log('📑 Checking Individual Widgets:\n');
    let allWidgetsPresent = true;
    const foundWidgets = [];
    const missingWidgets = [];
    const wrongIdWidgets = [];
    
    for (const expectedId of EXPECTED_WIDGETS) {
      const widget = page.locator(`[datatlid="${expectedId}"]`);
      const count = await widget.count();
      
      if (count === 0) {
        console.log(`  ❌ MISSING: datatlid="${expectedId}"`);
        missingWidgets.push(expectedId);
        allWidgetsPresent = false;
      } else {
        const id = await widget.getAttribute('id');
        const isVisible = await widget.isVisible();
        
        if (id !== 'hero2') {
          console.log(`  ⚠️  WRONG ID: datatlid="${expectedId}", id="${id}" (should be "hero2")`);
          wrongIdWidgets.push({ testId: expectedId, actualId: id });
          allWidgetsPresent = false;
        } else if (!isVisible) {
          console.log(`  ⚠️  HIDDEN: datatlid="${expectedId}", id="hero2" (not visible)`);
        } else {
          console.log(`  ✅ FOUND: datatlid="${expectedId}", id="hero2" (visible)`);
          foundWidgets.push(expectedId);
        }
      }
    }
    
    // Check for unexpected widgets
    const allWidgets = await page.locator(widgetSelector).all();
    console.log('\n📋 All Widgets on Page:\n');
    for (const widget of allWidgets) {
      const testId = await widget.getAttribute('datatlid');
      const id = await widget.getAttribute('id');
      const isExpected = EXPECTED_WIDGETS.includes(testId);
      if (!isExpected) {
        console.log(`  ⚠️  UNEXPECTED: datatlid="${testId}", id="${id}"`);
      }
    }
    
    // Final summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 SUMMARY');
    console.log('='.repeat(80));
    console.log(`✅ Widgets Found & Correct: ${foundWidgets.length}/${EXPECTED_WIDGETS.length}`);
    console.log(`❌ Missing Widgets: ${missingWidgets.length}`);
    console.log(`⚠️  Wrong ID: ${wrongIdWidgets.length}`);
    
    if (missingWidgets.length > 0) {
      console.log('\n❌ Missing Widgets:');
      missingWidgets.forEach(id => console.log(`   - ${id}`));
    }
    
    if (wrongIdWidgets.length > 0) {
      console.log('\n⚠️  Widgets with Wrong ID:');
      wrongIdWidgets.forEach(w => console.log(`   - ${w.testId}: id="${w.actualId}" (should be "hero2")`));
    }
    
    console.log('='.repeat(80) + '\n');
    
    if (allWidgetsPresent && foundWidgets.length === EXPECTED_WIDGETS.length) {
      console.log('✅ ✅ ✅ VALIDATION PASSED! All widgets are present and correct.');
      console.log('🚀 You can now run tests with: npm test\n');
      await browser.close();
      process.exit(0);
    } else {
      console.log('❌ ❌ ❌ VALIDATION FAILED! Please fix the issues above before running tests.');
      console.log('📝 Visit https://sp.athena-stageworker.xyz/wp-admin to add/fix widgets.');
      console.log('📄 All widget shortcodes are in tests-blocks.md\n');
      await browser.close();
      process.exit(1);
    }
    
  } catch (error) {
    console.log(`\n❌ ERROR: ${error.message}\n`);
    await browser.close();
    process.exit(1);
  }
}

// Run validation
validateWidgets().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
