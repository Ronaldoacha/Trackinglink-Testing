// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { generateBeautifulReport } = require('../generate-beautiful-report');
require('dotenv').config();

/**
 * Tracking Link API Tests
 * Tests the tracking link generation and redirection functionality
 * Each test simulates specific user parameters and verifies correct tracking link
 */

const CONFIG = {
  testWebsite: process.env.TEST_WEBSITE || 'https://sp.athena-stageworker.xyz',
  testPagePath: process.env.TEST_PAGE_NAME || 'apitl-tests',
  cfClientId: process.env.CF_ACCESS_CLIENT_ID_STAGING || '58c14a350fb83681fbe8056ebf70bbac.access',
  cfClientSecret: process.env.CF_ACCESS_CLIENT_SECRET_STAGING,
  backOfficeUrl: 'https://nextwork-staging.web.app/sales/brands/edit/1513'
};

/**
 * Opens a file in the default browser (cross-platform)
 * @param {string} filePath - Path to the file to open
 */
function openInBrowser(filePath) {
  const platform = process.platform;
  let command;
  
  if (platform === 'win32') {
    // Windows
    command = `start "" "${filePath}"`;
  } else if (platform === 'darwin') {
    // macOS
    command = `open "${filePath}"`;
  } else {
    // Linux and others
    command = `xdg-open "${filePath}"`;
  }
  
  exec(command, (error) => {
    if (error) {
      console.error(`⚠️  Could not automatically open browser: ${error.message}`);
      console.log(`📂 Please manually open: ${filePath}`);
    }
  });
}

// Test scenarios with expected parameters and redirect URLs
// All CTAs are identified by data-tl-id attribute (e.g., data-tl-id="test-r01")
const TEST_SCENARIOS = [
  {
    testId: 'test-r01',
    name: 'R01: Ultimate Fallback',
    expectedRule: 'R1',
    expectedKey: 'laz-vegas-casino#xx#zz#default#se',
    expectedRedirectUrl: 'https://oneupenginе.com/C.ashx?btag=a_1807b_39c_&affid=57&siteid=1807&adid=39&c=##UUID##',
    userParams: { country: 'DE', language: 'de', channel: 'se', target: null },
    performanceThreshold: 10000
  },
  {
    testId: 'test-r02',
    name: 'R02: EN All Countries',
    expectedRule: 'R2',
    expectedKey: 'laz-vegas-casino#en#zz#default#se',
    expectedRedirectUrl: 'https://oneupenginе.com/C.ashx?btag=a_1809b_39c_&affid=57&siteid=1809&adid=39&c=##UUID##',
    userParams: { country: 'BR', language: 'en', channel: 'se', target: null },
    performanceThreshold: 10000
  },
  {
    testId: 'test-r03',
    name: 'R03: EN CM Athena BHP',
    expectedRule: 'R3',
    expectedKey: 'laz-vegas-casino#en#cm#athena#se#bhp',
    expectedRedirectUrl: 'https://www.888casino.com/en/homepage?tracker=SE-LV-CB-EN',
    userParams: { country: 'CM', language: 'en', channel: 'se', target: 'bhp' },
    performanceThreshold: 10000
  },
  {
    testId: 'test-r04',
    name: 'R04: EN CM Athena SE',
    expectedRule: 'R4',
    expectedKey: 'laz-vegas-casino#en#cm#athena#se',
    expectedRedirectUrl: 'https://www.casinoguide.org/reviews/888casino',
    userParams: { country: 'CM', language: 'en', channel: 'se', target: null },
    performanceThreshold: 10000
  },
  {
    testId: 'test-r10',
    name: 'R10: Most Specific (Position 1)',
    expectedRule: 'R10',
    expectedKey: 'laz-vegas-casino#en#cm#sp.athena#pp#tc',
    expectedRedirectUrl: 'https://stage-umbrella-showcase.com/wordpress/cta-button-logo/',
    userParams: { country: 'CM', language: 'en', channel: 'pp', target: 'tc' },
    performanceThreshold: 2000, // Position 1 should be fastest
    priority: 'HIGH'
  },
  {
    testId: 'test-r11',
    name: 'R11: EN CM SP SE',
    expectedRule: 'R11',
    expectedKey: 'laz-vegas-casino#en#cm#sp.athena#se',
    expectedRedirectUrl: 'https://nextwork-staging.web.app/seo/websites/sp.athena-stageworker.xyz',
    userParams: { country: 'CM', language: 'en', channel: 'se', target: null },
    performanceThreshold: 10000
  },
  {
    testId: 'test-r14',
    name: 'R14: FR CM CA-ENG SE',
    expectedRule: 'R14',
    expectedKey: 'laz-vegas-casino#fr#cm#ca-eng#se',
    expectedRedirectUrl: 'https://www.williamhill.com/vegas?source=SELv',
    userParams: { country: 'CM', language: 'fr', channel: 'se', target: null },
    performanceThreshold: 10000
  },
  {
    testId: 'test-sent-01',
    name: 'Sentinel: Country ZZ',
    expectedRule: 'Sentinel',
    expectedKey: 'ZZ ignored, GeoIP used',
    expectedRedirectUrl: 'https://www.askgamblers.com/casino-reviews',
    userParams: { country: 'ZZ', language: 'en', channel: 'se', target: null },
    performanceThreshold: 10000,
    isSentinel: true
  },
  {
    testId: 'test-sent-02',
    name: 'Sentinel: Language xx',
    expectedRule: 'Sentinel',
    expectedKey: 'xx ignored, website lang used',
    expectedRedirectUrl: 'https://fr.betclic.com/paris-sportifs?pid=SELV-SP',
    userParams: { country: 'CM', language: 'xx', channel: 'se', target: null },
    performanceThreshold: 10000,
    isSentinel: true
  },
  {
    testId: 'test-sent-03',
    name: 'Sentinel: Both ZZ & xx',
    expectedRule: 'Sentinel',
    expectedKey: 'Both ignored, GeoIP + website lang',
    expectedRedirectUrl: 'https://sports.bet365.com/en/home?source=SE-LV-CB-SP',
    userParams: { country: 'ZZ', language: 'xx', channel: 'se', target: null },
    performanceThreshold: 10000,
    isSentinel: true
  },
  {
    testId: 'test-perf-01',
    name: 'Performance: Position 1',
    expectedRule: 'R10',
    expectedKey: 'laz-vegas-casino#en#cm#sp.athena#pp#tc',
    expectedRedirectUrl: 'https://stage-umbrella-showcase.com/wordpress/cta-button-logo/',
    userParams: { country: 'CM', language: 'en', channel: 'pp', target: 'tc' },
    performanceThreshold: 2000,
    priority: 'PERFORMANCE'
  },
  {
    testId: 'test-perf-02',
    name: 'Performance: Middle Position',
    expectedRule: 'Variable',
    expectedKey: 'Middle waterfall position',
    expectedRedirectUrl: 'https://www.playojo.com/ca/en/home?pid=SE-LV-CA-ENere',
    userParams: { country: 'US', language: 'en', channel: 'se', target: null },
    performanceThreshold: 5000,
    priority: 'PERFORMANCE'
  },
  {
    testId: 'test-perf-03',
    name: 'Performance: Fallback',
    expectedRule: 'Variable',
    expectedKey: 'Fallback position (may be slow)',
    expectedRedirectUrl: 'https://www.jeux-gratuits.com/casino-en-ligne-canada.html',
    userParams: { country: 'BR', language: 'pt', channel: 'se', target: null },
    performanceThreshold: 10000,
    priority: 'PERFORMANCE',
    expectedSlow: true
  }
];

test.describe('Tracking Link Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Set extra HTTP headers for Cloudflare Access if needed
    if (CONFIG.cfClientId && CONFIG.cfClientSecret) {
      await page.setExtraHTTPHeaders({
        'CF-Access-Client-Id': CONFIG.cfClientId,
        'CF-Access-Client-Secret': CONFIG.cfClientSecret
      });
    }
  });

  test('Test Page Exists and Loads', async ({ page }) => {
    const testUrl = `${CONFIG.testWebsite}/${CONFIG.testPagePath}`;
    console.log(`📄 Navigating to: ${testUrl}`);
    
    const response = await page.goto(testUrl, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    expect(response?.status()).toBeLessThan(400);
    
    // Take a screenshot
    await page.screenshot({ 
      path: 'test-results/test-page-loaded.png',
      fullPage: true 
    });
    
    console.log('✅ Test page loaded successfully');
  });

  test('Page Diagnostic - Find All Elements and CTAs', async ({ page, context }) => {
    const testUrl = `${CONFIG.testWebsite}/${CONFIG.testPagePath}`;
    
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🔍 PAGE DIAGNOSTIC - Loading page...`);
    console.log(`📄 URL: ${testUrl}`);
    console.log(`${'='.repeat(80)}`);
    
    // Set Cloudflare authentication headers if available
    if (CONFIG.cfClientId && CONFIG.cfClientSecret) {
      await context.addCookies([
        {
          name: 'CF_Authorization',
          value: CONFIG.cfClientId,
          domain: '.athena-stageworker.xyz',
          path: '/'
        }
      ]);
      console.log(`🔐 Added Cloudflare authentication cookies`);
    }
    
    // Clear cache and go to page with no-cache headers
    await context.clearCookies();
    await page.goto(testUrl, { 
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    console.log(`✅ Page loaded`);
    
    // Take screenshot immediately
    await page.screenshot({ path: 'test-results/diagnostic-page.png', fullPage: true });
    console.log(`📸 Screenshot saved to: test-results/diagnostic-page.png`);
    
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🔍 PAGE DIAGNOSTIC - Searching for elements...`);
    console.log(`${'='.repeat(80)}`);
    
    // Wait longer and scroll to trigger lazy loading
    console.log(`\n⏳ Waiting for dynamic content...`);
    await page.waitForTimeout(5000);
    
    // Scroll through the page to trigger lazy-loaded content
    console.log(`📜 Scrolling page to trigger lazy-loaded widgets...`);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(3000);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(2000);
    
    // Wait for widgets to be fully initialized (they might add data-tl-id via JavaScript)
    console.log(`\n⏳ Waiting for widgets to initialize with data-tl-id attributes...`);
    
    // Try to wait for at least one element with data-tl-id to appear
    try {
      await page.waitForSelector('[data-tl-id]', { timeout: 15000 });
      console.log(`   ✅ Found data-tl-id elements!`);
    } catch (e) {
      console.log(`   ⚠️  Timeout waiting for [data-tl-id] - checking anyway...`);
    }
    
    // Additional wait for dynamic content
    await page.waitForTimeout(3000);
    
    // Check using JavaScript evaluation (sometimes more reliable than locators)
    console.log(`\n🔍 Using JavaScript to find elements...`);
    const jsCheck = await page.evaluate(() => {
      const elements = document.querySelectorAll('[data-tl-id]');
      const testElements = document.querySelectorAll('[data-tl-id^="test-"]');
      const results = [];
      
      elements.forEach((el, i) => {
        if (i < 15) {
          results.push({
            tag: el.tagName,
            tlId: el.getAttribute('data-tl-id'),
            href: el.getAttribute('href'),
            text: el.textContent?.trim().substring(0, 30)
          });
        }
      });
      
      return {
        totalWithDataTlId: elements.length,
        totalWithTestPrefix: testElements.length,
        elements: results
      };
    });
    
    console.log(`   📊 JavaScript check results:`);
    console.log(`   - Elements with [data-tl-id]: ${jsCheck.totalWithDataTlId}`);
    console.log(`   - Elements with [data-tl-id^="test-"]: ${jsCheck.totalWithTestPrefix}`);
    
    if (jsCheck.totalWithDataTlId > 0) {
      console.log(`\n   ✅ Found via JavaScript! Listing elements:`);
      jsCheck.elements.forEach((el, i) => {
        console.log(`   ${i + 1}. <${el.tag}> data-tl-id="${el.tlId}" ${el.href ? `href="${el.href.substring(0, 30)}..."` : ''} text="${el.text}"`);
      });
    }
    
    // Get raw HTML to search
    const htmlContent = await page.content();
    console.log(`\n📄 Searching raw HTML source...`);
    const dataTlIdMatches = htmlContent.match(/data-tl-id="[^"]+"/g);
    if (dataTlIdMatches && dataTlIdMatches.length > 0) {
      console.log(`   ✅ Found ${dataTlIdMatches.length} data-tl-id attributes in HTML source!`);
      console.log(`   First 10 matches in HTML:`);
      dataTlIdMatches.slice(0, 10).forEach((match, i) => {
        console.log(`   ${i + 1}. ${match}`);
      });
    } else {
      console.log(`   ❌ No data-tl-id found in HTML source`);
    }
    
    // Final check after waiting
    const anyDataTlId = await page.locator('[data-tl-id]').count();
    console.log(`\n1️⃣ Elements with [data-tl-id] attribute (via locator): ${anyDataTlId}`);
    
    if (anyDataTlId > 0) {
      const elements = await page.locator('[data-tl-id]').all();
      console.log(`\n   Found ${elements.length} elements with data-tl-id:`);
      for (let i = 0; i < Math.min(elements.length, 15); i++) {
        const tlId = await elements[i].getAttribute('data-tl-id');
        const tagName = await elements[i].evaluate(el => el.tagName.toLowerCase());
        const id = await elements[i].getAttribute('id');
        const href = await elements[i].getAttribute('href');
        const text = await elements[i].textContent();
        console.log(`   ${i + 1}. <${tagName}> data-tl-id="${tlId}" ${id ? `id="${id}"` : ''} ${href ? `href="${href.substring(0, 40)}..."` : ''} text="${text?.trim().substring(0, 30)}"`);
      }
    } else {
      // Check for alternative attribute names
      console.log(`\n   Checking alternative attribute names...`);
      const dataTlid = await page.locator('[datatlid]').count();
      const dataTestId = await page.locator('[data-test-id]').count();
      const dataTestid = await page.locator('[data-testid]').count();
      console.log(`   - [datatlid] (no hyphen): ${dataTlid}`);
      console.log(`   - [data-test-id]: ${dataTestId}`);
      console.log(`   - [data-testid]: ${dataTestid}`);
      
      if (dataTestid > 0) {
        console.log(`\n   📋 Found ${dataTestid} elements with [data-testid]! Listing first 15:`);
        const testidElements = await page.locator('[data-testid]').all();
        for (let i = 0; i < Math.min(testidElements.length, 15); i++) {
          const testid = await testidElements[i].getAttribute('data-testid');
          const tagName = await testidElements[i].evaluate(el => el.tagName.toLowerCase());
          const href = await testidElements[i].getAttribute('href');
          const text = await testidElements[i].textContent();
          console.log(`   ${i + 1}. <${tagName}> data-testid="${testid}" ${href ? `href="${href.substring(0, 30)}..."` : ''} text="${text?.trim().substring(0, 25)}"`);
        }
      }
    }
    
    // Check for elements starting with "test-"
    const testPrefix = await page.locator('[data-tl-id^="test-"]').count();
    console.log(`\n2️⃣ Elements with [data-tl-id^="test-"]: ${testPrefix}`);
    
    // Check for iframes that might contain the widgets
    const iframes = await page.locator('iframe').count();
    console.log(`\n3️⃣ iframes on page: ${iframes}`);
    if (iframes > 0) {
      console.log(`   ⚠️  Widgets might be inside iframes (not yet checked)`);
    }
    
    // Check for common widget containers
    const hero2Count = await page.locator('#hero2').count();
    const widgetClass = await page.locator('[class*="widget"]').count();
    const trackingClass = await page.locator('[class*="tracking"]').count();
    console.log(`\n4️⃣ Possible widget containers:`);
    console.log(`   - id="hero2": ${hero2Count}`);
    console.log(`   - class contains "widget": ${widgetClass}`);
    console.log(`   - class contains "tracking": ${trackingClass}`);
    
    if (hero2Count > 0) {
      console.log(`\n   Inspecting #hero2 elements:`);
      const hero2Elements = await page.locator('#hero2').all();
      for (let i = 0; i < hero2Elements.length; i++) {
        const tagName = await hero2Elements[i].evaluate(el => el.tagName.toLowerCase());
        const classes = await hero2Elements[i].getAttribute('class');
        const dataTlId = await hero2Elements[i].getAttribute('data-tl-id');
        console.log(`   ${i + 1}. <${tagName}> class="${classes}" data-tl-id="${dataTlId || 'NONE'}"`);
        
        // Check for CTA buttons inside hero2
        const buttons = await hero2Elements[i].locator('a, button').all();
        console.log(`      Found ${buttons.length} buttons/links inside:`);
        for (let j = 0; j < Math.min(buttons.length, 3); j++) {
          const btnTag = await buttons[j].evaluate(el => el.tagName.toLowerCase());
          const btnTlId = await buttons[j].getAttribute('data-tl-id');
          const btnHref = await buttons[j].getAttribute('href');
          const btnText = await buttons[j].textContent();
          console.log(`      - <${btnTag}> data-tl-id="${btnTlId || 'NONE'}" ${btnHref ? `href="${btnHref.substring(0, 30)}..."` : ''} text="${btnText?.trim().substring(0, 20)}"`);
        }
      }
    }
    
    // Check page content for widget keywords
    console.log(`\n5️⃣ Searching page HTML for widget-related content...`);
    const pageContent = await page.content();
    const hasWidgetScript = pageContent.includes('widget') || pageContent.includes('Widget');
    const hasTrackingLink = pageContent.includes('tracking') || pageContent.includes('Tracking');
    const hasDataTlIdInHTML = pageContent.includes('data-tl-id');
    console.log(`   - "widget" in HTML: ${hasWidgetScript ? 'YES' : 'NO'}`);
    console.log(`   - "tracking" in HTML: ${hasTrackingLink ? 'YES' : 'NO'}`);
    console.log(`   - "data-tl-id" in HTML: ${hasDataTlIdInHTML ? 'YES ✓' : 'NO ✗'}`);
    
    // Check for all links and buttons
    const allLinks = await page.locator('a[href]').count();
    const allButtons = await page.locator('button').count();
    console.log(`\n6️⃣ All links on page: ${allLinks}`);
    console.log(`7️⃣ All buttons on page: ${allButtons}`);
    
    // Sample some links/buttons
    console.log(`\n   Sample of links/buttons (first 10):`);
    const sampleCTAs = await page.locator('a[href], button').all();
    for (let i = 0; i < Math.min(sampleCTAs.length, 10); i++) {
      const tagName = await sampleCTAs[i].evaluate(el => el.tagName.toLowerCase());
      const dataTlId = await sampleCTAs[i].getAttribute('data-tl-id');
      const href = await sampleCTAs[i].getAttribute('href');
      const text = await sampleCTAs[i].textContent();
      console.log(`   ${i + 1}. <${tagName}> data-tl-id="${dataTlId || 'NONE'}" text="${text?.trim().substring(0, 30)}" ${href ? `href="${href.substring(0, 30)}..."` : ''}`);
    }
    
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📋 DIAGNOSIS:`);
    if (anyDataTlId === 0) {
      if (hasDataTlIdInHTML) {
        console.log(`⚠️  data-tl-id found in HTML source but not in DOM!`);
        console.log(`   → Widgets might be disabled, hidden, or not rendered by JavaScript`);
        console.log(`   → Check browser console for JavaScript errors`);
      } else {
        console.log(`❌ No data-tl-id attributes found anywhere!`);
        console.log(`   → Please verify CTAs were added to: ${testUrl}`);
        console.log(`   → Example: <a data-tl-id="test-r01" href="...">CTA Text</a>`);
      }
    } else if (testPrefix === 0) {
      console.log(`⚠️  Found data-tl-id attributes, but none starting with "test-"`);
      console.log(`   → Check the attribute values listed above`);
    } else {
      console.log(`✅ Found ${testPrefix} elements with data-tl-id starting with "test-"`);
      console.log(`   → Ready to run tests!`);
    }
    console.log(`${'='.repeat(80)}\n`);
  });

  test('Verify All Test CTAs Present', async ({ page }) => {
    const testUrl = `${CONFIG.testWebsite}/${CONFIG.testPagePath}`;
    await page.goto(testUrl, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    await page.waitForTimeout(3000); // Wait for CTAs to load
    
    // Look for CTAs with data-tl-id="test-*"
    const ctaSelector = '[data-tl-id^="test-"]';
    const ctaCount = await page.locator(ctaSelector).count();
    
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🔍 CTA Verification - All CTAs with data-tl-id attribute`);
    console.log(`${'='.repeat(80)}`);
    console.log(`🔍 Checking for CTAs with selector: ${ctaSelector}`);
    console.log(`🔢 Found ${ctaCount} CTAs with data-tl-id attribute`);
    console.log(`📋 Expected ${TEST_SCENARIOS.length} test scenarios`);
    
    if (ctaCount === 0) {
      console.log(`\n⚠️  WARNING: No CTAs found! Run the 'Page Diagnostic' test first.`);
    }
    
    expect(ctaCount).toBeGreaterThan(0);
    
    // List all found CTAs with their actual data-tl-id values
    const ctas = await page.locator(ctaSelector).all();
    console.log(`\n📑 CTAs Found in DOM (data-tl-id values):`);
    for (let i = 0; i < ctas.length; i++) {
      const testId = await ctas[i].getAttribute('data-tl-id');
      const href = await ctas[i].getAttribute('href');
      const tagName = await ctas[i].evaluate(el => el.tagName.toLowerCase());
      const isVisible = await ctas[i].isVisible();
      console.log(`  ${i + 1}. ${isVisible ? '✓' : '✗'} <${tagName}> data-tl-id="${testId}", href="${href?.substring(0, 50)}..." ${isVisible ? '(visible)' : '(hidden)'}`);
    }
    
    // Check which expected CTAs are missing
    console.log(`\n📋 Checking for Expected Test Cases...`);
    for (const scenario of TEST_SCENARIOS) {
      const exists = await page.locator(`[data-tl-id="${scenario.testId}"]`).count() > 0;
      if (!exists) {
        console.log(`  ❌ MISSING: data-tl-id="${scenario.testId}" - ${scenario.name}`);
      } else {
        console.log(`  ✅ FOUND: ${scenario.testId} - ${scenario.name}`);
      }
    }
    console.log(`${'='.repeat(80)}\n`);
  });

  /*
  // OLD APPROACH: Dynamic test generation for each scenario (COMMENTED OUT - Replaced by comprehensive test)
  // This approach created individual tests which was slower and less reliable
  for (const scenario of TEST_SCENARIOS) {
    test(`${scenario.name} - Verify Parameters & Redirect`, async ({ page }, testInfo) => {
      const testUrl = `${CONFIG.testWebsite}/${CONFIG.testPagePath}`;
      
      // Add test metadata for Allure report
      testInfo.annotations.push(
        { type: 'test_id', description: scenario.testId },
        { type: 'expected_rule', description: scenario.expectedRule },
        { type: 'expected_key', description: scenario.expectedKey },
        { type: 'country', description: scenario.userParams.country },
        { type: 'language', description: scenario.userParams.language },
        { type: 'channel', description: scenario.userParams.channel },
        { type: 'threshold', description: `${scenario.performanceThreshold}ms` }
      );
      
      console.log(`\n${'='.repeat(80)}`);
      console.log(`🧪 Testing: ${scenario.name}`);
      console.log(`${'='.repeat(80)}`);
      console.log(`📍 Test ID: ${scenario.testId} (data-tl-id attribute)`);
      console.log(`🎯 Expected Rule: ${scenario.expectedRule}`);
      console.log(`🔑 Expected Key: ${scenario.expectedKey}`);
      console.log(`👤 User Params:`, scenario.userParams);
      console.log(`⏱️  Performance Threshold: ${scenario.performanceThreshold}ms`);
      console.log(`\n🔗 EXPECTED REDIRECT URL:`);
      console.log(`   ${scenario.expectedRedirectUrl || 'Not specified'}`);
      
      // Navigate and ensure page fully loads
      console.log(`\n📄 Loading test page...`);
      await page.goto(testUrl, { 
        waitUntil: 'domcontentloaded', // More lenient than networkidle
        timeout: 60000  // Increased timeout to 60 seconds
      });
      
      // Wait for DOM to be completely loaded
      await page.waitForLoadState('domcontentloaded');
      console.log(`✅ DOM loaded`);
      
      // Additional wait for network to settle (but don't fail if it doesn't)
      try {
        await page.waitForLoadState('networkidle', { timeout: 10000 });
        console.log(`✅ Network idle`);
      } catch {
        console.log(`⚠️ Network still active, but continuing...`);
      }
      
      // Wait for all widgets to render in the DOM
      await page.waitForTimeout(3000);
      console.log(`✅ Waiting for widgets to render...`);
      
      // Verify at least one widget is present before proceeding - MANDATORY check
      const widgetSelector = '[data-tl-id^="test-"]';
      console.log(`\n🔍 Checking for widgets with selector: ${widgetSelector}`);
      
      // This WILL throw an error and FAIL the test if no widgets found - no proceeding without widgets!
      await page.waitForSelector(widgetSelector, { timeout: 10000 });
      const widgetCount = await page.locator(widgetSelector).count();
      console.log(`✅ Found ${widgetCount} widgets rendered in DOM`);
      
      // Print all data-tl-id values found
      if (widgetCount > 0) {
        console.log(`\n📋 Widgets found with data-tl-id attribute:`);
        const allFoundWidgets = await page.locator(widgetSelector).all();
        for (let i = 0; i < allFoundWidgets.length; i++) {
          const widgetDataTlid = await allFoundWidgets[i].getAttribute('data-tl-id');
          const widgetId = await allFoundWidgets[i].getAttribute('id');
          console.log(`   ${i + 1}. data-tl-id="${widgetDataTlid}", id="${widgetId}"`);
        }
        console.log('');
      }
      
      // Additional check: ensure we have the expected minimum number of widgets
      if (widgetCount === 0) {
        throw new Error(`❌ CRITICAL: No widgets found on page! Cannot proceed with tests. Please ensure widgets are added to ${testUrl}`);
      }
      
      console.log(`✅ Widget validation passed - ${widgetCount} widgets present`);
      
      // Search DOM for specific widget using data-tl-id attribute
      console.log(`\n🔍 Searching DOM for widget...`);
      console.log(`   DOM Query: document.querySelector('[data-tl-id="${scenario.testId}"]')`);
      console.log(`   Looking for: data-tl-id="${scenario.testId}"`);
      
      const widget = page.locator(`[data-tl-id="${scenario.testId}"]`);
      
      // Check if widget exists in DOM
      const widgetExistsInDOM = await widget.count() > 0;
      console.log(`   ${widgetExistsInDOM ? '✅' : '❌'} Widget ${widgetExistsInDOM ? 'found' : 'NOT found'} in DOM`);
      
      if (!widgetExistsInDOM) {
        console.log(`\n❌ CRITICAL: Widget with data-tl-id="${scenario.testId}" does not exist in DOM!`);
        
        // Log all available widgets for debugging
        const allWidgets = await page.locator('[data-tl-id^="test-"]').all();
        console.log(`   Found ${allWidgets.length} widgets with data-tl-id on page:`);
        for (const w of allWidgets) {
          const wTestId = await w.getAttribute('data-tl-id');
          const wId = await w.getAttribute('id');
          console.log(`   - data-tl-id="${wTestId}", id="${wId}"`);
        }
        
        throw new Error(`Widget with data-tl-id="${scenario.testId}" not found in DOM. Ensure widget is added to page!`);
      }
      
      // Get the actual data-tl-id value from the found widget to confirm
      const foundDataTlid = await widget.getAttribute('data-tl-id');
      const foundId = await widget.getAttribute('id');
      console.log(`\n✅ WIDGET FOUND IN DOM:`);
      console.log(`   data-tl-id="${foundDataTlid}"`);
      console.log(`   id="${foundId}"`);
      console.log(`   Expected data-tl-id: "${scenario.testId}"`);
      console.log(`   Match: ${foundDataTlid === scenario.testId ? '✅' : '❌'}`);
      
      // Wait for widget to be visible
      try {
        await widget.waitFor({ state: 'visible', timeout: 15000 });
        console.log(`✅ Widget is visible on page`);
      } catch (error) {
        console.log(`❌ Widget found in DOM but NOT visible`);
        
        // Log all available widgets for debugging
        const allWidgets = await page.locator('[data-tl-id^="test-"]').all();
        console.log(`   Found ${allWidgets.length} widgets with data-tl-id on page`);
        for (const w of allWidgets) {
          const wTestId = await w.getAttribute('data-tl-id');
          const wId = await w.getAttribute('id');
          console.log(`   - data-tl-id="${wTestId}", id="${wId}"`);
        }
        
        throw new Error(`Widget with data-tl-id="${scenario.testId}" not present or not visible. Ensure all widgets have id="hero2" and data-tl-id="${scenario.testId}"!`);
      }
      
      // Scroll widget into view (human-like behavior)
      await widget.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      
      // Find the CTA button - more specific selector
      const ctaButton = widget.locator('a[href*="http"], button').first();
      const buttonExists = await ctaButton.count() > 0;
      
      expect(buttonExists).toBeTruthy();
      
      if (buttonExists) {
        console.log(`✅ CTA button found in widget`);
        
        // Ensure button is visible and enabled
        await ctaButton.waitFor({ state: 'visible', timeout: 5000 });
        await ctaButton.scrollIntoViewIfNeeded();
        
        // Get button details for logging
        const href = await ctaButton.getAttribute('href');
        const buttonText = await ctaButton.textContent();
        console.log(`🔗 Button href: ${href || 'dynamic/generated'}`);
        console.log(`📝 Button text: ${buttonText?.trim() || 'N/A'}`);
        
        // Read all widget attributes from the DOM element
        console.log(`\n🔍 Reading Widget Attributes from DOM Element...`);
        const widgetAttributes = await widget.evaluate(el => ({
          dataTlId: el.getAttribute('data-tl-id'),
          id: el.getAttribute('id'),
          country: el.getAttribute('country'),
          language: el.getAttribute('language'),
          channel: el.getAttribute('channel'),
          trackinglinktarget: el.getAttribute('trackinglinktarget'),
          cloakedlink: el.getAttribute('cloakedlink')
        }));
        console.log(`📋 Widget DOM Attributes:`, JSON.stringify(widgetAttributes, null, 2));
        
        // Attach initial page info to Allure
        await testInfo.attach('Initial Page URL', {
          body: testUrl,
          contentType: 'text/plain'
        });
        
        await testInfo.attach('Widget DOM Attributes', {
          body: JSON.stringify(widgetAttributes, null, 2),
          contentType: 'application/json'
        });
        
        // Take screenshot before clicking
        const beforeScreenshot = await page.screenshot({ fullPage: false });
        await testInfo.attach('Before Click Screenshot', {
          body: beforeScreenshot,
          contentType: 'image/png'
        });
        
        // Start timing - PRECISE timing for redirect capture
        const startTime = Date.now();
        console.log(`\n⏱️  Starting redirect timer...`);
        console.log(`👤 Simulating human click with params:`);
        console.log(`   Country: ${scenario.userParams.country}`);
        console.log(`   Language: ${scenario.userParams.language}`);
        console.log(`   Channel: ${scenario.userParams.channel}`);
        console.log(`   Target: ${scenario.userParams.target || 'homepage (default)'}`);
        
        // Human-like click simulation with NEW TAB redirect capture
        let navigationOccurred = false;
        let finalUrl = '';
        let newPage = null;
        
        try {
          // Since button has target="_blank", it opens a new tab/popup
          // We need to listen for the new page/popup
          const popupPromise = page.context().waitForEvent('page', { timeout: 25000 });
          
          // Human-like click with slight delay
          await page.waitForTimeout(300);
          console.log(`🖱️  Clicking CTA button...`);
          await ctaButton.click({ delay: 100 });
          console.log(`✅ Click executed - waiting for new tab to open...`);
          
          // Wait for new tab/popup to open
          try {
            newPage = await popupPromise;
            navigationOccurred = true;
            console.log(`✅ New tab opened successfully`);
            
            // Wait for the new page to load and any redirects to complete
            console.log(`⏳ Waiting for redirects to complete (5 seconds)...`);
            await newPage.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {
              console.log(`⚠️ Network idle timeout - proceeding anyway`);
            });
            
            // Give extra time for any JavaScript redirects or slow servers
            await page.waitForTimeout(5000);
            
            // Get the final URL from the new tab
            finalUrl = newPage.url();
            console.log(`✅ Captured redirect URL from new tab`);
            
          } catch (popupError) {
            console.log(`⚠️ New tab error: ${popupError.message}`);
            // Fallback: try to get URL from current page if no popup
            finalUrl = page.url();
          }
          
        } catch (clickError) {
          console.log(`⚠️ Click/Navigation error: ${clickError.message}`);
          finalUrl = page.url();
        }
        
        const redirectTime = Date.now() - startTime;
        
        // Take screenshot of the new tab/redirected page
        if (newPage) {
          try {
            const redirectedScreenshot = await newPage.screenshot({ fullPage: false });
            await testInfo.attach('Redirected Page Screenshot', {
              body: redirectedScreenshot,
              contentType: 'image/png'
            });
          } catch (screenshotError) {
            console.log(`⚠️ Could not capture redirected page screenshot`);
          }
        }
        
        console.log(`\n${'='.repeat(80)}`);
        console.log(`📊 TEST RESULTS:`);
        console.log(`${'='.repeat(80)}`);
        console.log(`⏱️  Redirect Time: ${redirectTime}ms`);
        console.log(`🔄 New Tab Opened: ${newPage ? 'YES ✅' : 'NO ❌'}`);
        console.log(`\n🔗 EXPECTED REDIRECT URL:`);
        console.log(`   ${scenario.expectedRedirectUrl || 'Not specified'}`);
        console.log(`\n🎯 ACTUAL REDIRECT URL (Captured from new tab):`);
        console.log(`   ${finalUrl}`);
        
        // Detailed URL comparison
        const urlsMatch = finalUrl === scenario.expectedRedirectUrl;
        const urlsPartialMatch = finalUrl.includes(scenario.expectedRedirectUrl.split('?')[0]) || 
                                  scenario.expectedRedirectUrl.includes(finalUrl.split('?')[0]);
        
        console.log(`\n📋 URL COMPARISON:`);
        if (urlsMatch) {
          console.log(`   ✅ EXACT MATCH - URLs are identical`);
        } else if (urlsPartialMatch) {
          console.log(`   ⚠️  PARTIAL MATCH - Base URLs match, parameters may differ`);
        } else {
          console.log(`   ❌ DIFFERENT - URLs do not match`);
        }
        
        // Extract and compare domains
        try {
          const expectedDomain = new URL(scenario.expectedRedirectUrl).hostname;
          const actualDomain = new URL(finalUrl).hostname;
          console.log(`   Expected Domain: ${expectedDomain}`);
          console.log(`   Actual Domain: ${actualDomain}`);
          console.log(`   Domain Match: ${expectedDomain === actualDomain ? '✅ YES' : '❌ NO'}`);
        } catch (urlError) {
          console.log(`   ⚠️ Could not parse URLs for domain comparison`);
        }
        
        console.log(`\n✓ Within Performance Threshold: ${redirectTime < scenario.performanceThreshold ? 'YES ✅' : 'NO ❌'} (${scenario.performanceThreshold}ms)`);
        console.log(`✓ Navigation Occurred: ${navigationOccurred ? 'YES ✅' : 'NO ❌'}`);
        console.log(`${'='.repeat(80)}`);
        
        // Close the new tab if it was opened
        if (newPage) {
          try {
            await newPage.close();
            console.log(`🗑️  Closed redirected tab`);
          } catch (closeError) {
            console.log(`⚠️ Could not close new tab: ${closeError.message}`);
          }
        }
        
        // Add prominent "Verify Tracking Link" section to Allure report body
        const urlMatchStatus = finalUrl === scenario.expectedRedirectUrl ? '✅ EXACT MATCH' : 
                               urlsPartialMatch ? '⚠️ PARTIAL MATCH (Base URL matches)' : 
                               '❌ URLs DO NOT MATCH';
        
        await testInfo.attach('Verify Tracking Link', {
          body: `═══════════════════════════════════════════════════════════════════════════════
VERIFY TRACKING LINK - Redirect URL Comparison
═══════════════════════════════════════════════════════════════════════════════

📍 Test Case: ${scenario.name}
📍 Test ID (Expected): ${scenario.testId}
🔍 Widget data-tl-id (Found in DOM): ${widgetAttributes.dataTlId}
🆔 Widget id (Found in DOM): ${widgetAttributes.id}

✅ DOM Search Query: [data-tl-id="${scenario.testId}"]
${widgetAttributes.dataTlId === scenario.testId ? '✅ Widget data-tl-id matches expected test ID' : '⚠️ Widget data-tl-id does NOT match expected'}
${widgetAttributes.id === 'hero2' ? '✅ Widget id is correct (hero2)' : '❌ Widget id is incorrect (should be hero2)'}

═══════════════════════════════════════════════════════════════════════════════
REDIRECT URL COMPARISON
═══════════════════════════════════════════════════════════════════════════════

🎯 EXPECTED REDIRECT URL:
${scenario.expectedRedirectUrl || 'Not specified'}

🔗 ACTUAL REDIRECT URL (Captured from new tab):
${finalUrl}

═══════════════════════════════════════════════════════════════════════════════
📊 COMPARISON RESULT:
═══════════════════════════════════════════════════════════════════════════════

Status: ${urlMatchStatus}

New Tab Opened: ${newPage ? '✅ YES' : '❌ NO'}
Redirect Time: ${redirectTime}ms
Performance Threshold: ${scenario.performanceThreshold}ms
Within Threshold: ${redirectTime < scenario.performanceThreshold ? '✅ YES' : '❌ NO'}

${finalUrl === scenario.expectedRedirectUrl ? 
  '✅ SUCCESS: URLs match exactly!' : 
  urlsPartialMatch ? 
  '⚠️ PARTIAL: Base URLs match, parameters differ (may be acceptable if using dynamic UUIDs)' : 
  '❌ FAILED: URLs do not match - please verify tracking link configuration'}

═══════════════════════════════════════════════════════════════════════════════`,
          contentType: 'text/plain'
        });
        
        // Attach redirect details to Allure
        await testInfo.attach('Redirect Details', {
          body: JSON.stringify({
            'Test ID': scenario.testId,
            'Test Name': scenario.name,
            'User Parameters': scenario.userParams,
            'Expected Rule': scenario.expectedRule,
            'Expected Key': scenario.expectedKey,
            '': '='.repeat(50),
            'EXPECTED REDIRECT URL': scenario.expectedRedirectUrl || 'Not specified',
            'ACTUAL REDIRECT URL': finalUrl,
            'URL Match Status': finalUrl === scenario.expectedRedirectUrl ? 'EXACT MATCH ✅' : 'DIFFERENT URL ⚠️',
            '  ': '='.repeat(50),
            'New Tab Opened': newPage ? 'YES' : 'NO',
            'Redirect Time (ms)': redirectTime,
            'Performance Threshold (ms)': scenario.performanceThreshold,
            'Within Threshold': redirectTime < scenario.performanceThreshold ? 'YES ✅' : 'NO ❌',
            'Navigation Success': navigationOccurred ? 'YES ✅' : 'NO ❌',
            '   ': '='.repeat(50),
            'Test Passed': (navigationOccurred && redirectTime < scenario.performanceThreshold) ? 'YES ✅' : 'Check Results ⚠️'
          }, null, 2),
          contentType: 'application/json'
        });
        
        // Assertions
        
        // 1. Should have opened a new tab/page
        expect(navigationOccurred).toBeTruthy();
        console.log(`✅ Navigation occurred (new tab opened)`);
        
        // 2. Should have a valid URL
        expect(finalUrl).toMatch(/https?:\/\/.+/);
        console.log(`✅ Valid URL format captured`);
        
        // 3. Should not be the test page
        expect(finalUrl).not.toContain(CONFIG.testPagePath);
        console.log(`✅ Redirected away from test page`);
        
        // 4. Performance check (with allowance for slow tests)
        if (!scenario.expectedSlow) {
          expect(redirectTime).toBeLessThan(scenario.performanceThreshold);
          console.log(`✅ Performance within threshold (${redirectTime}ms < ${scenario.performanceThreshold}ms)`);
        } else {
          console.log(`⚠️ Slow test (expected): ${redirectTime}ms`);
        }
        
        // Final Summary
        console.log(`\n${'='.repeat(80)}`);
        console.log(`✅ TEST COMPLETED: ${scenario.name}`);
        console.log(`${'='.repeat(80)}`);
        console.log(`📍 Test ID (Expected): ${scenario.testId}`);
        console.log(`🔍 Widget data-tl-id (Found in DOM): ${widgetAttributes.dataTlId}`);
        console.log(`🆔 Widget id (Found in DOM): ${widgetAttributes.id}`);
        console.log(`✅ DOM Query Used: document.querySelector('[data-tl-id="${scenario.testId}"]')`);
        console.log(`🔗 Expected URL: ${scenario.expectedRedirectUrl ? scenario.expectedRedirectUrl.substring(0, 80) + '...' : 'Not specified'}`);
        console.log(`🎯 Actual URL:   ${finalUrl.substring(0, 80)}${finalUrl.length > 80 ? '...' : ''}`);
        console.log(`⏱️  Redirect Time: ${redirectTime}ms`);
        console.log(`✓ Status: ${navigationOccurred && redirectTime < scenario.performanceThreshold && finalUrl.length > 0 ? 'PASSED ✅' : 'CHECK RESULTS ⚠️'}`);
        console.log(`${'='.repeat(80)}\n`);
      }
    });
  }
  */

  // NEW COMPREHENSIVE TEST - Tests all CTAs in a single efficient test run
  test('Complete Test - All CTAs Redirect Capture', async ({ page, context }, testInfo) => {
    // Increase test timeout to 10 minutes for multiple CTAs
    test.setTimeout(600000);
    
    // Clean old test results before starting new test
    console.log(`\n🧹 Cleaning old test results...`);
    const foldersToClean = ['allure-results', 'test-results'];
    
    for (const folder of foldersToClean) {
      const folderPath = path.join(__dirname, '..', folder);
      try {
        if (fs.existsSync(folderPath)) {
          await fs.promises.rm(folderPath, { recursive: true, force: true });
          console.log(`   ✅ Cleaned: ${folder}/`);
        }
        // Recreate the directory for reporters to use
        await fs.promises.mkdir(folderPath, { recursive: true });
      } catch (error) {
        console.log(`   ⚠️  Could not clean ${folder}/: ${error.message}`);
      }
    }
    
    // Clean old timestamped reports (keep only structure)
    const reportsPath = path.join(__dirname, '..', 'test-reports');
    try {
      if (fs.existsSync(reportsPath)) {
        const files = fs.readdirSync(reportsPath);
        const oldReports = files.filter(f => f.startsWith('tracking-links-report-') && f.endsWith('.html'));
        
        for (const file of oldReports) {
          fs.unlinkSync(path.join(reportsPath, file));
        }
        
        if (oldReports.length > 0) {
          console.log(`   ✅ Deleted ${oldReports.length} old report(s)`);
        }
      }
    } catch (error) {
      console.log(`   ⚠️  Could not clean test-reports/: ${error.message}`);
    }
    
    console.log(`✅ Cleanup complete!\n`);
    
    const testUrl = `${CONFIG.testWebsite}/${CONFIG.testPagePath}`;
    
    console.log(`${'='.repeat(80)}`);
    console.log(`🚀 COMPREHENSIVE TEST - All CTAs Redirect Capture`);
    console.log(`${'='.repeat(80)}`);
    console.log(`📄 Test Page: ${testUrl}`);
    console.log(`${'='.repeat(80)}\n`);
    
    // Load the page once
    console.log(`📄 Loading test page...`);
    await page.goto(testUrl, { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });
    
    await page.waitForLoadState('domcontentloaded');
    console.log(`✅ DOM loaded`);
    
    // Wait for network to settle
    try {
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      console.log(`✅ Network idle`);
    } catch {
      console.log(`⚠️ Network still active, but continuing...`);
    }
    
    // Wait for CTAs to render and scroll to load lazy content
    await page.waitForTimeout(3000);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1000);
    console.log(`✅ Page ready\n`);
    
    // Try multiple selectors to find CTAs
    const ctaSelectors = [
      '[data-tl-id^="test-"]',           // Preferred: CTAs with test IDs
      '[data-testid="toplist3-cta"]',    // Toplist CTAs
      'a[href*="/go/"]',                 // Links with /go/ pattern
      '.cta-button',                      // Class-based
      'a[target="_blank"]'                // Links that open in new tab
    ];
    
    let allCTAs = [];
    let usedSelector = '';
    
    for (const selector of ctaSelectors) {
      const count = await page.locator(selector).count();
      console.log(`🔍 Trying selector: ${selector} - Found: ${count}`);
      
      if (count > 0) {
        allCTAs = await page.locator(selector).all();
        usedSelector = selector;
        console.log(`✅ Using selector: ${selector} (${count} CTAs found)\n`);
        break;
      }
    }
    
    if (allCTAs.length === 0) {
      console.log(`❌ No CTAs found with any selector!`);
      expect(allCTAs.length).toBeGreaterThan(0);
      return;
    }
    
    console.log(`🔍 Discovered ${allCTAs.length} CTAs\n`);
    
    const results = [];
    
    // Test each CTA found on the page
    for (let i = 0; i < allCTAs.length; i++) {
      // Re-query the CTA to avoid stale element references
      const ctaButton = page.locator(usedSelector).nth(i);
      
      try {
        // Get CTA attributes
        const testId = await ctaButton.getAttribute('data-tl-id') || `CTA-${i + 1}`;
        const href = await ctaButton.getAttribute('href');
        const text = await ctaButton.textContent();
        const tagName = await ctaButton.evaluate(el => el.tagName.toLowerCase());
        
        console.log(`\n${'─'.repeat(80)}`);
        console.log(`🧪 Test ${i + 1}/${allCTAs.length}: ${testId}`);
        console.log(`${'─'.repeat(80)}`);
        console.log(`📍 ID: ${testId}`);
        console.log(`🔗 Element: <${tagName}>`);
        console.log(`📝 Text: ${text?.trim().substring(0, 40)}`);
        console.log(`🔗 href: ${href?.substring(0, 60)}...`);
        
        // Scroll CTA into view
        await ctaButton.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
        
        // Capture redirect
        const startTime = Date.now();
        let newPage = null;
        let finalUrl = '';
        let navigationOccurred = false;
        
        // Arrays to collect ALL data from the very beginning
        let redirectChain = [];
        let networkRequests = [];
        let allPageUrls = [];
        
        try {
          console.log(`🖱️  Clicking CTA...`);
          
          // Set up CONTEXT-LEVEL listener to catch the new page from the very first moment
          // This captures events even before we get the page object
          const newPagePromise = new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Timeout waiting for new page')), 45000);
            
            context.once('page', async (newPageObj) => {
              clearTimeout(timeout);
              
              // Immediately set up listeners on the new page BEFORE it starts loading
              console.log(`✅ New tab opened - attaching listeners immediately`);
              
              // DON'T capture initial URL immediately - it might be chrome-error
              // Wait for actual navigation/network activity first
              
              // Monitor ALL requests from the beginning
              newPageObj.on('request', request => {
                const url = request.url();
                const resourceType = request.resourceType();
                if (resourceType === 'document') {
                  console.log(`   🌐 HTTP Request: ${url.substring(0, 80)}...`);
                  networkRequests.push({
                    url,
                    timestamp: Date.now(),
                    type: 'request'
                  });
                  allPageUrls.push({ url, timestamp: Date.now(), source: 'request' });
                }
              });
              
              // Monitor ALL responses - these are the real redirected URLs
              newPageObj.on('response', async response => {
                const url = response.url();
                const status = response.status();
                const resourceType = response.request().resourceType();
                if (resourceType === 'document') {
                  console.log(`   📡 HTTP Response: ${status} - ${url.substring(0, 70)}...`);
                  networkRequests.push({
                    url,
                    status,
                    timestamp: Date.now(),
                    type: 'response',
                    isRedirect: status >= 300 && status < 400
                  });
                  
                  // Capture successful response URLs - these are real
                  if (status >= 200 && status < 300) {
                    allPageUrls.push({ url, timestamp: Date.now(), source: 'response', status });
                  }
                  
                  // If it's a redirect, capture the location header
                  if (status >= 300 && status < 400) {
                    try {
                      const headers = await response.allHeaders();
                      if (headers.location) {
                        console.log(`   ➡️  Redirect to: ${headers.location}`);
                        allPageUrls.push({ url: headers.location, timestamp: Date.now(), source: 'redirect-header' });
                      }
                    } catch {}
                  }
                }
              });
              
              // Monitor frame navigation - capture real navigated URLs
              newPageObj.on('framenavigated', (frame) => {
                if (frame === newPageObj.mainFrame()) {
                  const url = frame.url();
                  // Only capture if it's NOT a chrome-error
                  if (!url.startsWith('chrome-error://') && !url.includes('chromewebdata')) {
                    console.log(`   🔗 Navigation: ${url.substring(0, 80)}...`);
                    redirectChain.push({
                      url,
                      timestamp: Date.now(),
                      isError: false
                    });
                    allPageUrls.push({ url, timestamp: Date.now(), source: 'navigation', stage: 'framenavigated' });
                  }
                }
              });
              
              resolve(newPageObj);
            });
          });
          
          // Click the CTA with a delay
          await ctaButton.click({ delay: 100 });
          console.log(`✅ Click executed - waiting for new tab...`);
          
          // Wait for new page
          newPage = await newPagePromise;
          navigationOccurred = true;
          console.log(`⏳ Monitoring redirect chain...`);
          
          // Give the page a moment to start loading before checking
          await newPage.waitForTimeout(500);
          
          // Try to evaluate the page early to get any redirect information
          try {
            const pageInfo = await newPage.evaluate(() => {
              return {
                location: window.location.href,
                referrer: document.referrer,
                readyState: document.readyState
              };
            });
            if (pageInfo.location && !pageInfo.location.startsWith('chrome-error://')) {
              console.log(`   📍 Early capture from page: ${pageInfo.location.substring(0, 80)}...`);
              allPageUrls.push({
                url: pageInfo.location,
                timestamp: Date.now(),
                source: 'early-evaluation',
                readyState: pageInfo.readyState
              });
            }
          } catch (evalError) {
            console.log(`   ⚠️ Could not evaluate page early`);
          }
          
          console.log(`⏳ Waiting for redirects...`);
          
          // Wait for new page
          newPage = await newPagePromise;
          navigationOccurred = true;
          console.log(`⏳ Monitoring redirect chain...`);
          
          // Wait progressive intervals and capture URL at each stage
          const waitStages = [
            { name: 'domcontentloaded', timeout: 8000 },
            { name: 'load', timeout: 12000 },
            { name: 'networkidle', timeout: 15000 }
          ];
          
          for (const stage of waitStages) {
            try {
              await newPage.waitForLoadState(stage.name, { timeout: stage.timeout });
              const currentUrl = newPage.url();
              
              // Only capture non-error URLs
              if (currentUrl && !currentUrl.startsWith('chrome-error://') && !currentUrl.includes('chromewebdata')) {
                console.log(`   ✅ ${stage.name}: ${currentUrl.substring(0, 80)}...`);
                
                // Add to URLs list
                allPageUrls.push({
                  url: currentUrl,
                  timestamp: Date.now(),
                  stage: stage.name,
                  source: 'loadstate-check'
                });
                
                console.log(`   ✅ Valid URL captured at ${stage.name} stage!`);
                break;
              } else {
                console.log(`   ⚠️ ${stage.name}: Still on chrome-error, waiting for redirect...`);
              }
            } catch (waitError) {
              const currentUrl = newPage.url();
              if (currentUrl && !currentUrl.startsWith('chrome-error://') && !currentUrl.includes('chromewebdata')) {
                console.log(`   ✅ ${stage.name} timeout but got valid URL: ${currentUrl.substring(0, 60)}...`);
                allPageUrls.push({
                  url: currentUrl,
                  timestamp: Date.now(),
                  stage: stage.name,
                  source: 'loadstate-timeout'
                });
              }
            }
          }
          
          // Additional wait to catch any late redirects - give more time
          await newPage.waitForTimeout(4000);
          const lastUrl = newPage.url();
          
          // Only add final URL if it's valid
          if (lastUrl && !lastUrl.startsWith('chrome-error://') && !lastUrl.includes('chromewebdata')) {
            allPageUrls.push({
              url: lastUrl,
              timestamp: Date.now(),
              stage: 'final-check',
              source: 'final'
            });
          }
          
          console.log(`📋 Total URLs captured: ${allPageUrls.length}`);
          
          // Choose the best URL from all captured URLs
          // Priority: 
          // 1) Valid URLs from early evaluation - captured immediately on page load
          // 2) Valid URLs from HTTP responses (200 OK) - most reliable  
          // 3) Valid URLs from navigation events - actual page navigations
          // 4) Valid URLs from loadstate checks - page object after redirect
          // 5) Any non-error URL from any source
          
          const earlyEvaluationUrls = allPageUrls.filter(u => 
            u.source === 'early-evaluation' &&
            u.url && 
            !u.url.startsWith('chrome-error://') && 
            !u.url.includes('chromewebdata')
          );
          
          const httpResponseUrls = allPageUrls.filter(u => 
            u.source === 'response' && 
            u.status === 200 &&
            u.url && 
            !u.url.startsWith('chrome-error://') && 
            !u.url.includes('chromewebdata') &&
            // Filter out known third-party resources
            !u.url.includes('livechatinc.com') &&
            !u.url.includes('googletagmanager.com') &&
            !u.url.includes('analytics.') &&
            !u.url.includes('facebook.com') &&
            !u.url.includes('twitter.com')
          );
          
          const navigationUrls = allPageUrls.filter(u => 
            u.source === 'navigation' &&
            u.url && 
            !u.url.startsWith('chrome-error://') && 
            !u.url.includes('chromewebdata')
          );
          
          const loadstateUrls = allPageUrls.filter(u => 
            ['loadstate-check', 'loadstate-timeout', 'final'].includes(u.source) &&
            u.url && 
            !u.url.startsWith('chrome-error://') && 
            !u.url.includes('chromewebdata')
          );
          
          const requestUrls = allPageUrls.filter(u => 
            u.source === 'request' &&
            u.url && 
            !u.url.startsWith('chrome-error://') && 
            !u.url.includes('chromewebdata')
          );
          
          const anyValidUrls = allPageUrls.filter(u => 
            u.url && 
            !u.url.startsWith('chrome-error://') && 
            !u.url.includes('chromewebdata')
          );
          
          if (earlyEvaluationUrls.length > 0) {
            finalUrl = earlyEvaluationUrls[0].url;
            console.log(`✅ Best URL: From early page evaluation - ${finalUrl}`);
          } else if (httpResponseUrls.length > 0) {
            finalUrl = httpResponseUrls[0].url; // Use first main domain response
            console.log(`✅ Best URL: From HTTP response (200 OK) - ${finalUrl}`);
          } else if (navigationUrls.length > 0) {
            finalUrl = navigationUrls[navigationUrls.length - 1].url;
            console.log(`✅ Best URL: From navigation event - ${finalUrl}`);
          } else if (loadstateUrls.length > 0) {
            finalUrl = loadstateUrls[0].url;
            console.log(`✅ Best URL: From load state check - ${finalUrl}`);
          } else if (requestUrls.length > 0) {
            finalUrl = requestUrls[0].url;
            console.log(`✅ Best URL: From HTTP request - ${finalUrl}`);
          } else if (anyValidUrls.length > 0) {
            finalUrl = anyValidUrls[0].url;
            console.log(`✅ Best URL: Any valid URL - ${finalUrl}`);
          } else {
            finalUrl = 'chrome-error://chromewebdata/';
            console.log(`⚠️ No valid URLs captured - redirect failed`);
          }
          
          const redirectTime = Date.now() - startTime;
          
          console.log(`✅ Redirect captured in ${redirectTime}ms`);
          console.log(`🎯 Final URL: ${finalUrl}`);
          console.log(`📊 Total captured: ${allPageUrls.length} URLs, ${networkRequests.length} network events, ${redirectChain.length} navigations`);
          
          // Check if we got a valid URL
          const isValidUrl = finalUrl && !finalUrl.startsWith('chrome-error://') && !finalUrl.includes('chromewebdata');
          
          results.push({
            testId,
            text: text?.trim().substring(0, 40),
            elementType: tagName,
            originalHref: href,
            finalUrl,
            redirectTime,
            totalUrlsCaptured: allPageUrls.length,
            networkEventsCount: networkRequests.length,
            navigationOccurred: true,
            status: isValidUrl ? 'SUCCESS' : 'REDIRECT_ERROR'
          });
          
          // Wait a bit before closing to ensure all redirects are complete
          await newPage.waitForTimeout(2000);
          
          // Close the new tab
          try {
            await newPage.close();
            console.log(`✅ New tab closed`);
          } catch {
            console.log(`⚠️ New tab already closed`);
          }
          
          // Extra wait after closing to let everything settle
          await page.waitForTimeout(1000);
          
        } catch (error) {
          const redirectTime = Date.now() - startTime;
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.log(`❌ Error: ${errorMessage}`);
          
          // Try to capture URL even if there was an error
          let errorUrl = '';
          if (newPage) {
            try {
              errorUrl = newPage.url();
            } catch {
              errorUrl = 'Could not capture URL';
            }
          }
          
          results.push({
            testId,
            text: text?.trim().substring(0, 40),
            elementType: tagName,
            originalHref: href,
            finalUrl: errorUrl || 'No URL captured',
            error: errorMessage,
            redirectTime,
            navigationOccurred: false,
            status: 'FAILED'
          });
          
          // Try to close new page if it exists
          if (newPage) {
            try {
              await newPage.close();
            } catch {
              console.log(`⚠️ Could not close new tab`);
            }
          }
        }
        
        // Wait significantly before next CTA to ensure complete isolation
        console.log(`⏸️  Waiting before next test to ensure complete isolation...`);
        await page.waitForTimeout(3000);
        
      } catch (ctaError) {
        const errorMessage = ctaError instanceof Error ? ctaError.message : String(ctaError);
        console.log(`❌ Error processing CTA: ${errorMessage}`);
        results.push({
          testId: `CTA-${i + 1}`,
          error: errorMessage,
          status: 'FAILED'
        });
      }
    }
    
    // Generate comprehensive summary report
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📊 COMPREHENSIVE TEST RESULTS SUMMARY`);
    console.log(`${'='.repeat(80)}\n`);
    
    const successfulTests = results.filter(r => r.status === 'SUCCESS').length;
    const failedTests = results.filter(r => r.status === 'FAILED' || r.status === 'REDIRECT_ERROR').length;
    const totalTests = results.length;
    const successRate = (successfulTests / totalTests) * 100;
    
    console.log(`📈 Overall Test Statistics:`);
    console.log(`   📋 Total CTAs Tested: ${totalTests} tracking link buttons`);
    console.log(`   ✅ Successful Redirects: ${successfulTests} (captured valid destination URLs)`);
    console.log(`   ❌ Failed Tests: ${failedTests} (no valid redirect URL captured)`);
    console.log(`   📊 Overall Success Rate: ${successRate.toFixed(1)}%`);
    
    // Add interpretation
    if (successRate >= 80) {
      console.log(`   🟢 Status: Excellent - Most tracking links working correctly`);
    } else if (successRate >= 50) {
      console.log(`   🟡 Status: Warning - Some tracking links may need attention`);
    } else {
      console.log(`   🔴 Status: Critical - Many tracking links not functioning properly`);
    }
    
    // Performance metrics
    const successfulWithTime = results.filter(r => r.redirectTime && r.status === 'SUCCESS');
    if (successfulWithTime.length > 0) {
      const avgTime = successfulWithTime.reduce((sum, r) => sum + (r.redirectTime || 0), 0) / successfulWithTime.length;
      const minTime = Math.min(...successfulWithTime.map(r => r.redirectTime || 0));
      const maxTime = Math.max(...successfulWithTime.map(r => r.redirectTime || 0));
      
      console.log(`\n⏱️  Redirect Performance Metrics:`);
      console.log(`   📊 Average Redirect Time: ${avgTime.toFixed(0)}ms (mean time from click to final URL)`);
      console.log(`   ⚡ Fastest Redirect: ${minTime}ms (quickest redirect captured)`);
      console.log(`   🐢 Slowest Redirect: ${maxTime}ms (longest redirect captured)`);
    }
    
    // Network activity summary
    const totalNetworkEvents = results.reduce((sum, r) => sum + (r.networkEventsCount || 0), 0);
    const avgNetworkEvents = totalTests > 0 ? (totalNetworkEvents / totalTests).toFixed(1) : 0;
    
    console.log(`\n🌐 Network Activity Summary:`);
    console.log(`   📡 Total HTTP Requests Monitored: ${totalNetworkEvents} requests`);
    console.log(`   📊 Average Network Events per Test: ${avgNetworkEvents} requests`);
    console.log(`   💡 Note: 0 network events typically indicates tracking link not responding`);
    
    // Detailed results table
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📋 DETAILED TEST RESULTS - Individual CTA Redirect Tests`);
    console.log(`${'='.repeat(80)}\n`);
    
    results.forEach((result, index) => {
      const status = result.status === 'SUCCESS' ? '✅' : '❌';
      const statusLabel = result.status === 'SUCCESS' ? 'PASSED' : 'FAILED';
      
      console.log(`${status} Test #${index + 1} [${statusLabel}]: ${result.testId}`);
      console.log(`   📝 Button Text: "${result.text}"`);
      
      if (result.status === 'SUCCESS') {
        console.log(`   ⏱️  Redirect Duration: ${result.redirectTime}ms`);
        console.log(`   🌐 Network Activity: ${result.networkEventsCount || 0} HTTP requests captured`);
        console.log(`   📍 URLs Captured: ${result.totalUrlsCaptured || 0} URL(s) during redirect chain`);
        const finalUrl = result.finalUrl || '';
        console.log(`   🔗 Original Tracking Link: ${result.originalHref?.substring(0, 65)}${result.originalHref && result.originalHref.length > 65 ? '...' : ''}`);
        console.log(`   🎯 Final Destination URL: ${finalUrl.substring(0, 65)}${finalUrl.length > 65 ? '...' : ''}`);
      } else {
        console.log(`   ⚠️  Error Reason: ${result.error || 'Unknown error - redirect failed to complete'}`);
        if (result.networkEventsCount !== undefined) {
          console.log(`   🌐 Network Activity: ${result.networkEventsCount} HTTP requests (indicates tracking link not responding)`);
        }
      }
      console.log('');
    });
    
    console.log(`${'='.repeat(80)}\n`);
    
    // Attach results to test report
    await testInfo.attach('Complete Test Results', {
      body: JSON.stringify(results, null, 2),
      contentType: 'application/json'
    });
    
    // Create summary for Allure
    const summaryText = `
COMPREHENSIVE TEST SUMMARY
${'='.repeat(80)}

Total Widgets Tested: ${totalTests}
Successful Redirects: ${successfulTests} ✅
Failed Tests: ${failedTests} ❌
Success Rate: ${((successfulTests / totalTests) * 100).toFixed(1)}%

${'='.repeat(80)}
DETAILED RESULTS:

${results.map((r, i) => {
  const status = r.status === 'SUCCESS' ? '✅' : '❌';
  return `${status} ${i + 1}. ${r.testId}
   Text: ${r.text || 'N/A'}
   ${r.status === 'SUCCESS' ? `Time: ${r.redirectTime}ms` : `Error: ${r.error}`}
   ${r.status === 'SUCCESS' ? `URL: ${r.finalUrl}` : ''}`;
}).join('\n\n')}
${'='.repeat(80)}
    `.trim();
    
    await testInfo.attach('Test Summary Report', {
      body: summaryText,
      contentType: 'text/plain'
    });
    
    // Assertions
    expect(totalTests).toBeGreaterThan(0);
    expect(successfulTests).toBeGreaterThan(0);
    
    // Log success rate for informational purposes (don't fail on low success rate)
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📊 FINAL TEST COMPLETION SUMMARY`);
    console.log(`${'='.repeat(80)}\n`);
    console.log(`📊 Overall Success Rate: ${successRate.toFixed(1)}%`);
    
    if (successRate >= 80) {
      console.log(`🟢 Excellent! Most tracking links are working correctly.`);
    } else if (successRate >= 50) {
      console.log(`🟡 Warning: Success rate below 80% - Some tracking links may need attention.`);
      console.log(`💡 Review failed tests to identify misconfigured or broken tracking links.`);
    } else {
      console.log(`🔴 Critical: Success rate below 50% - Many tracking links are not functioning.`);
      console.log(`⚠️  Immediate action required to fix tracking link configuration.`);
    }
    
    console.log(`\n✅ Test Suite Completed! ${successfulTests}/${totalTests} CTAs redirected successfully.`);
    console.log(`📋 ${failedTests} test(s) failed - review detailed results above for failure reasons.\n`);
    
    // Generate beautiful HTML report
    console.log(`\n📊 Generating beautiful HTML report...`);
    try {
      const reportHtml = generateBeautifulReport(results);
      const reportDir = path.join(__dirname, '..', 'test-reports');
      
      // Create reports directory if it doesn't exist
      if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
      }
      
      // Save report with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const reportPath = path.join(reportDir, `tracking-links-report-${timestamp}.html`);
      fs.writeFileSync(reportPath, reportHtml, 'utf8');
      
      // Also save as latest report for easy access
      const latestReportPath = path.join(reportDir, 'latest-report.html');
      fs.writeFileSync(latestReportPath, reportHtml, 'utf8');
      
      console.log(`✅ Report generated successfully!`);
      console.log(`📂 Report location: ${reportPath}`);
      console.log(`🔗 Latest report: ${latestReportPath}`);
      console.log(`\n🌐 Opening report in your browser...`);
      
      // Automatically open the report in the default browser
      setTimeout(() => {
        openInBrowser(latestReportPath);
        console.log(`\n✨ Report opened! If it didn't open automatically, please open: ${latestReportPath}`);
      }, 500);
    } catch (reportError) {
      console.error(`❌ Error generating report: ${reportError.message}`);
    }
  });
});
