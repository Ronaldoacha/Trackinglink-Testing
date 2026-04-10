/**
 * Page Diagnostic Tool - Find What's Actually On The Page
 * Use this to discover what attributes and elements exist on the test page
 * 
 * Usage: node diagnose-page.js
 */

const { chromium } = require('playwright');
require('dotenv').config();

const CONFIG = {
  testWebsite: process.env.TEST_WEBSITE || 'https://sp.athena-stageworker.xyz',
  testPagePath: process.env.TEST_PAGE_NAME || 'apitl-tests',
  cfClientId: process.env.CF_ACCESS_CLIENT_ID_STAGING || '58c14a350fb83681fbe8056ebf70bbac.access',
  cfClientSecret: process.env.CF_ACCESS_CLIENT_SECRET_STAGING
};

async function diagnosePage() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 PAGE DIAGNOSTIC - Discovering Page Content');
  console.log('='.repeat(80));
  
  const testUrl = `${CONFIG.testWebsite}/${CONFIG.testPagePath}`;
  console.log(`📍 Analyzing: ${testUrl}\n`);

  const browser = await chromium.launch({ headless: false }); // Show browser
  const context = await browser.newContext();
  
  if (CONFIG.cfClientId && CONFIG.cfClientSecret) {
    await context.setExtraHTTPHeaders({
      'CF-Access-Client-Id': CONFIG.cfClientId,
      'CF-Access-Client-Secret': CONFIG.cfClientSecret
    });
  }
  
  const page = await context.newPage();
  
  try {
    console.log('🌐 Loading page...');
    await page.goto(testUrl, { 
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    
    console.log('✅ Page loaded\n');
    
    // Wait extra time for widgets to render
    console.log('⏳ Waiting 10 seconds for any dynamic content to load...');
    await page.waitForTimeout(10000);
    console.log('✅ Wait complete\n');
    
    console.log('='.repeat(80));
    console.log('🔍 SEARCHING FOR WIDGETS WITH DIFFERENT SELECTORS');
    console.log('='.repeat(80) + '\n');
    
    // Try multiple possible selectors
    const selectors = [
      { name: '[datatlid^="test-"]', desc: 'datatlid attribute starting with "test-"' },
      { name: '[data-tlid^="test-"]', desc: 'data-tlid attribute starting with "test-"' },
      { name: '[data-testid^="test-"]', desc: 'data-testid attribute starting with "test-"' },
      { name: '[datatlid]', desc: 'Any element with datatlid attribute' },
      { name: '[data-tlid]', desc: 'Any element with data-tlid attribute' },
      { name: '[data-testid]', desc: 'Any element with data-testid attribute' },
      { name: '[id^="hero"]', desc: 'id starting with "hero"' },
      { name: '[id="hero2"]', desc: 'id exactly "hero2"' },
      { name: 'nw-blocks-hero2', desc: 'Custom element nw-blocks-hero2' },
      { name: '.nw-block', desc: 'Class nw-block' },
      { name: '[class*="hero"]', desc: 'Class containing "hero"' },
      { name: '[class*="widget"]', desc: 'Class containing "widget"' }
    ];
    
    for (const selector of selectors) {
      const count = await page.locator(selector.name).count();
      if (count > 0) {
        console.log(`✅ Found ${count} elements: ${selector.desc}`);
        console.log(`   Selector: ${selector.name}`);
        
        // Get first few elements' details
        const elements = await page.locator(selector.name).all();
        const showCount = Math.min(elements.length, 3);
        
        for (let i = 0; i < showCount; i++) {
          const el = elements[i];
          const attrs = await el.evaluate(node => {
            const result = {};
            for (let attr of node.attributes) {
              result[attr.name] = attr.value;
            }
            return result;
          });
          console.log(`   Element ${i + 1}:`, JSON.stringify(attrs, null, 2));
        }
        console.log('');
      } else {
        console.log(`❌ Not found: ${selector.desc} (${selector.name})`);
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('📋 SEARCHING FOR TEST-RELATED ATTRIBUTES');
    console.log('='.repeat(80) + '\n');
    
    // Search for any element with "test" in any attribute
    const allElements = await page.evaluate(() => {
      const results = [];
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_ELEMENT,
        null
      );
      
      let node;
      let count = 0;
      while (node = walker.nextNode()) {
        if (count++ > 1000) break; // Limit to first 1000 elements
        
        const attrs = {};
        let hasTestAttr = false;
        
        for (let attr of node.attributes) {
          attrs[attr.name] = attr.value;
          if (attr.name.includes('test') || attr.value.includes('test')) {
            hasTestAttr = true;
          }
        }
        
        if (hasTestAttr) {
          results.push({
            tag: node.tagName.toLowerCase(),
            attributes: attrs
          });
        }
      }
      
      return results;
    });
    
    if (allElements.length > 0) {
      console.log(`✅ Found ${allElements.length} elements with "test" in attributes:\n`);
      allElements.slice(0, 10).forEach((el, i) => {
        console.log(`   ${i + 1}. <${el.tag}>`, JSON.stringify(el.attributes, null, 2));
      });
      if (allElements.length > 10) {
        console.log(`   ... and ${allElements.length - 10} more\n`);
      }
    } else {
      console.log('❌ No elements found with "test" in any attribute\n');
    }
    
    console.log('='.repeat(80));
    console.log('📄 PAGE STRUCTURE ANALYSIS');
    console.log('='.repeat(80) + '\n');
    
    // Get page title and main content
    const pageTitle = await page.title();
    const bodyHTML = await page.evaluate(() => {
      // Get a sample of the body content
      return document.body.innerHTML.substring(0, 2000);
    });
    
    console.log(`📄 Page Title: "${pageTitle}"`);
    console.log(`\n📝 Body Content (first 2000 chars):`);
    console.log('─'.repeat(80));
    console.log(bodyHTML);
    console.log('─'.repeat(80) + '\n');
    
    // Take screenshot
    await page.screenshot({ 
      path: 'test-results/page-diagnostic.png',
      fullPage: true 
    });
    console.log('📸 Screenshot saved: test-results/page-diagnostic.png\n');
    
    // Try to find any custom elements or web components
    const customElements = await page.evaluate(() => {
      const results = [];
      document.querySelectorAll('*').forEach(el => {
        if (el.tagName.includes('-')) {
          results.push({
            tag: el.tagName.toLowerCase(),
            attributes: Array.from(el.attributes).reduce((acc, attr) => {
              acc[attr.name] = attr.value;
              return acc;
            }, {})
          });
        }
      });
      return results.slice(0, 20); // First 20 custom elements
    });
    
    if (customElements.length > 0) {
      console.log('='.repeat(80));
      console.log('🔧 CUSTOM ELEMENTS / WEB COMPONENTS FOUND');
      console.log('='.repeat(80) + '\n');
      customElements.forEach((el, i) => {
        console.log(`   ${i + 1}. <${el.tag}>`);
        console.log(`      Attributes:`, JSON.stringify(el.attributes, null, 2));
      });
      console.log('');
    }
    
    console.log('='.repeat(80));
    console.log('💡 RECOMMENDATIONS');
    console.log('='.repeat(80) + '\n');
    
    console.log('Based on the analysis above:');
    console.log('1. Check which selector found your widgets');
    console.log('2. Verify the exact attribute name used (datatlid vs data-tlid vs data-testid)');
    console.log('3. Update test files to use the correct selector');
    console.log('4. Check if widgets are custom elements (tags with hyphens)');
    console.log('5. Review the screenshot to see what\'s actually on the page\n');
    
    console.log('Browser will stay open for 30 seconds for manual inspection...');
    console.log('Press Ctrl+C to close early.\n');
    
    await page.waitForTimeout(30000);
    
    await browser.close();
    
  } catch (error) {
    console.log(`\n❌ Error: ${error.message}\n`);
    await browser.close();
    process.exit(1);
  }
}

diagnosePage().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
