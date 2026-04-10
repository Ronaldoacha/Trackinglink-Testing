# Tracking Link API - QA Test Suite

**Advanced QA Engineer Implementation**

This repository contains a comprehensive test suite for validating tracking link generation, selection logic, and redirect performance for the NextWork tracking link API system.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Quick Start](#quick-start)
4. [Test Scenarios](#test-scenarios)
5. [Manual Testing Guide](#manual-testing-guide)
6. [Automated Testing](#automated-testing)
7. [CI/CD - Daily Automated Tests](#cicd---daily-automated-tests)
8. [Performance Metrics](#performance-metrics)
9. [Test Report](#test-report)

---

## 🎯 Overview

### Test Objectives

This QA suite verifies:
- ✅ **Correct tracking link selection** based on user country
- ✅ **Language-based matching** for internationalization
- ✅ **Default fallback behavior** when no specific match exists
- ✅ **Multi-attribute matching** (country + language + device)
- ✅ **Redirect performance** and latency measurement
- ✅ **Cross-browser compatibility**

### System Under Test

- **Test Website:** https://sp.athena-stageworker.xyz
- **Test Page:** /apitl-tests
- **Brand:** laz-vegas-casino
- **API Endpoint:** NextWork Tracking Link API (Staging)
- **Back Office:** https://nextwork-staging.web.app/sales/tracking-links

---

## 📦 Prerequisites

### Required Access

1. **WordPress Admin Credentials**
   - Username: `admin`
   - Password: `Admin12345@`
   - URL: https://sp.athena-stageworker.xyz/wp-admin

2. **API Access**
   - API Key: `ec8f48393d356109ec022c358a0dbb38c098627293cd001b1a5ee8d3723d2d8d`
   - Email: `ronaldo@doualadigitalimpact.com`

3. **Cloudflare Zero Trust** (for staging access)
   - Client ID: `58c14a350fb83681fbe8056ebf70bbac.access`
   - Client Secret: `54d196c5cc8b2feb99ba0f54bfa64dd9ab818af61c3f156700fdbea44c860c3a`

4. **Microsoft Authentication** (if required)
   - Email: `ronaldo@doualadigitalimpact.com`
   - Password: `237Kameroon`

### Required Tools

- Modern web browser (Chrome, Firefox, Edge, or Safari)
- Browser DevTools access (F12)
- Optional: VPN for geo-location testing
- Optional: Node.js for automated scripts

---

## 🚀 Quick Start

### Step 1: Create WordPress Test Page

1. Login to WordPress admin: https://sp.athena-stageworker.xyz/wp-admin
   - Username: `admin`
   - Password: `Admin12345@`

2. Navigate to **Pages > Add New**

3. Set page title: `API Tracking Link Tests`

4. Set page slug to: `apitl-tests`

5. Add the following **5 Shortcode blocks** (one for each test case):

#### Shortcode 1: US Country Match
```html
<nw-blocks 
  id="hero2-test1" 
  cloakedlink="laz-vegas-casino" 
  country="US" 
  language="en" 
  maxrows="1" 
  ctakey="cta-claim-bonus" 
  headingtext="Featured Casino - US Test" 
  headinglevel="h2" 
  headingalignment="center" 
  introtext="Test for US country match" 
  introtextalignment="center" 
  ctacolors="['#05842A', '#05842A']" 
  ctahovercolors="['#096725', '#096725']" 
  trackinglinktarget="homepage" 
  target="_blank" 
  rel="nofollow" 
  rating="4.3" 
  socialproofkey="wgt-reviewPageHeader-socialproof-sp">
</nw-blocks>
```

#### Shortcode 2: Spanish Language Match
```html
<nw-blocks 
  id="hero2-test2" 
  cloakedlink="laz-vegas-casino" 
  country="ZZ" 
  language="es" 
  maxrows="1" 
  ctakey="cta-claim-bonus" 
  headingtext="Featured Casino - Spanish Test" 
  headinglevel="h2" 
  headingalignment="center" 
  introtext="Test para coincidencia de idioma español" 
  introtextalignment="center" 
  ctacolors="['#05842A', '#05842A']" 
  ctahovercolors="['#096725', '#096725']" 
  trackinglinktarget="homepage" 
  target="_blank" 
  rel="nofollow" 
  rating="4.3" 
  socialproofkey="wgt-reviewPageHeader-socialproof-sp">
</nw-blocks>
```

#### Shortcode 3: Default Fallback
```html
<nw-blocks 
  id="hero2-test3" 
  cloakedlink="laz-vegas-casino" 
  country="ZZ" 
  language="en" 
  maxrows="1" 
  ctakey="cta-claim-bonus" 
  headingtext="Featured Casino - Default Test" 
  headinglevel="h2" 
  headingalignment="center" 
  introtext="Test for default fallback tracking link" 
  introtextalignment="center" 
  ctacolors="['#05842A', '#05842A']" 
  ctahovercolors="['#096725', '#096725']" 
  trackinglinktarget="homepage" 
  target="_blank" 
  rel="nofollow" 
  rating="4.3" 
  socialproofkey="wgt-reviewPageHeader-socialproof-sp">
</nw-blocks>
```

#### Shortcode 4: Canadian Market
```html
<nw-blocks 
  id="hero2-test4" 
  cloakedlink="laz-vegas-casino" 
  country="CA" 
  language="en" 
  maxrows="1" 
  ctakey="cta-claim-bonus" 
  headingtext="Featured Casino - Canada Test" 
  headinglevel="h2" 
  headingalignment="center" 
  introtext="Test for Canadian players" 
  introtextalignment="center" 
  ctacolors="['#05842A', '#05842A']" 
  ctahovercolors="['#096725', '#096725']" 
  trackinglinktarget="homepage" 
  target="_blank" 
  rel="nofollow" 
  rating="4.3" 
  socialproofkey="wgt-reviewPageHeader-socialproof-sp">
</nw-blocks>
```

#### Shortcode 5: UK Multi-Attribute
```html
<nw-blocks 
  id="hero2-test5" 
  cloakedlink="laz-vegas-casino" 
  country="GB" 
  language="en" 
  maxrows="1" 
  ctakey="cta-claim-bonus" 
  headingtext="Featured Casino - UK Test" 
  headinglevel="h2" 
  headingalignment="center" 
  introtext="Test for UK players with multiple attributes" 
  introtextalignment="center" 
  ctacolors="['#05842A', '#05842A']" 
  ctahovercolors="['#096725', '#096725']" 
  trackinglinktarget="homepage" 
  target="_blank" 
  rel="nofollow" 
  rating="4.3" 
  socialproofkey="wgt-reviewPageHeader-socialproof-sp">
</nw-blocks>
```

6. Click **Publish** to make the page live

7. Verify page is accessible at: https://sp.athena-stageworker.xyz/apitl-tests

---

### Step 2: Execute Manual Tests

For each test scenario, follow these steps:

#### Testing Procedure

1. **Clear browser cache and cookies**
   - Chrome: Ctrl+Shift+Del > Clear browsing data
   - Firefox: Ctrl+Shift+Del > Clear Recent History
   - Edge: Ctrl+Shift+Del > Clear browsing data

2. **Open Browser DevTools** (Press F12)
   - Navigate to **Network** tab
   - Check "Preserve log" to keep data after redirect

3. **Navigate to test page**
   - URL: https://sp.athena-stageworker.xyz/apitl-tests

4. **Start performance measurement**
   - Open **Console** tab in DevTools
   - Run this script:
   ```javascript
   console.time('redirect-time');
   window.redirectStartTime = Date.now();
   ```

5. **Scroll to the specific test scenario**
   - Find the relevant "Featured Casino" section

6. **Click the "Claim Bonus" CTA button**

7. **After redirect completes**, run in Console:
   ```javascript
   console.timeEnd('redirect-time');
   const redirectTime = Date.now() - window.redirectStartTime;
   console.log('Redirect took:', redirectTime, 'ms');
   console.log('Final URL:', window.location.href);
   ```

8. **Record the results**:
   - Final redirected URL
   - Redirect time (in milliseconds)
   - Tracking link ID (from URL parameters or Network tab)
   - Any errors in Console

9. **Go back to test page** and repeat for next scenario

---

## 🧪 Test Scenarios

### Test Case 1: US Country Match Priority (TL-001)

**Objective:** Verify that users from the US are directed to US-specific tracking links

**User Profile:**
- Country: `US`
- Language: `en`
- Device: `desktop`

**Expected Result:**
- Tracking link should have country=US attribute
- Redirect time: < 2000ms
- Final URL should contain US-specific parameters

**Data to Capture:**
- ✅ Final redirect URL
- ✅ Redirect time (ms)
- ✅ Tracking link ID
- ✅ Matched attributes

---

### Test Case 2: Spanish Language Match Priority (TL-002)

**Objective:** Verify that Spanish-speaking users get language-appropriate tracking links

**User Profile:**
- Country: `MX` (or any)
- Language: `es`
- Device: `desktop`

**Expected Result:**
- Tracking link should have language=es attribute
- Redirect time: < 2000ms
- Final URL should contain Spanish language parameters

**Data to Capture:**
- ✅ Final redirect URL
- ✅ Redirect time (ms)
- ✅ Tracking link ID
- ✅ Language parameter verification

---

### Test Case 3: Default Fallback Behavior (TL-003)

**Objective:** Verify default tracking link is used when no specific match is found

**User Profile:**
- Country: `ZZ` (unmatched)
- Language: `en`
- Device: `desktop`

**Expected Result:**
- Should use default/global tracking link
- Redirect time: < 2000ms
- Fallback logic should trigger correctly

**Data to Capture:**
- ✅ Final redirect URL
- ✅ Redirect time (ms)
- ✅ Confirmation it's the default TL
- ✅ No errors in console

---

### Test Case 4: Canadian Market Verification (TL-004)

**Objective:** Verify Canadian market targeting works correctly

**User Profile:**
- Country: `CA`
- Language: `en`
- Device: `desktop`

**Expected Result:**
- Tracking link should have country=CA attribute
- Redirect time: < 2000ms
- Final URL should contain CA parameters

**Data to Capture:**
- ✅ Final redirect URL
- ✅ Redirect time (ms)
- ✅ Tracking link ID
- ✅ Canadian market parameters

---

### Test Case 5: UK Multi-Attribute Match (TL-005)

**Objective:** Verify multiple attribute matching (country + language)

**User Profile:**
- Country: `GB`
- Language: `en`
- Device: `desktop`

**Expected Result:**
- Tracking link should match both GB country AND en language
- Redirect time: < 2000ms
- Highest priority match wins

**Data to Capture:**
- ✅ Final redirect URL
- ✅ Redirect time (ms)
- ✅ Tracking link ID
- ✅ All matched attributes

---

## 🤖 CI/CD - Daily Automated Tests

### Overview

This project includes automated daily testing using **GitHub Actions** that:
- ⏰ Runs every weekday (Monday-Friday) at **8:00 AM**
- 🔄 Runs on every push to **master/main** branch
- ✅ Executes all test scenarios automatically
- 📊 Generates comprehensive Allure reports
- 📧 Sends email notifications with results to **ronaldo@doualadigitalimpact.com**

### Setup Instructions

#### 1. Push to GitHub

```bash
# Initialize git repository (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Automated tracking link tests"

# Add your GitHub repository
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push to GitHub
git push -u origin main
```

#### 2. Configure GitHub Secrets

After pushing to GitHub, you **must** configure the following secrets:

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret from the list below:

**Required Secrets:**
- `API_KEY` - Your API key
- `API_EMAIL` - ronaldo@doualadigitalimpact.com
- `CF_ACCESS_CLIENT_ID_STAGING` - Cloudflare client ID
- `CF_ACCESS_CLIENT_SECRET_STAGING` - Cloudflare client secret
- `MICROSOFT_EMAIL` - Microsoft account email
- `MICROSOFT_PASSWORD` - Microsoft account password
- `WP_ADMIN_URL` - WordPress admin URL
- `WP_USERNAME` - WordPress username
- `WP_PASSWORD` - WordPress password
- `TEST_WEBSITE` - Test website URL
- `BACKOFFICE_URL` - Back office URL
- `EMAIL_USERNAME` - Your Outlook email (for sending reports)
- `EMAIL_PASSWORD` - Your Outlook email password or app password

📄 **See [GITHUB_SECRETS_SETUP.md](GITHUB_SECRETS_SETUP.md) for detailed instructions**

#### 3. Email Configuration (Important!)

For Outlook/Microsoft 365:
- If you have 2-factor authentication enabled, create an **App Password**
- Go to https://account.microsoft.com/security
- Under **Advanced security options**, click **App passwords**
- Create a new app password and use it as `EMAIL_PASSWORD`

#### 4. Test the Workflow

After configuring secrets, test the workflow:
1. Go to **Actions** tab in your repository
2. Select **Daily Automated Tests**
3. Click **Run workflow** → **Run workflow**
4. Check your email for the test report!

### Workflow Schedule

The tests run automatically:
- **Scheduled:** Monday through Friday at 8:00 AM UTC (no weekends)
- **On Push:** Every push to master or main branch
- **Manual Trigger:** Available anytime via GitHub Actions UI

### Test Reports

After each run:
- ✅ Allure reports are generated automatically
- ✅ Reports are available as artifacts (30-day retention)
- ✅ Email notification sent with test status
- ✅ HTML report attached to email

### Adjusting the Schedule

To change the test time, edit `.github/workflows/daily-tests.yml`:

```yaml
schedule:
  # Change the cron expression
  # Format: 'minute hour * * day-of-week'
  # Example: '0 9 * * 1-5' = 9 AM Monday-Friday
  - cron: '0 8 * * 1-5'
```

**Timezone Examples:**
- 8 AM UTC = `'0 8 * * 1-5'`
- 8 AM WAT (UTC+1) = `'0 7 * * 1-5'`
- 8 AM EST (UTC-5) = `'0 13 * * 1-5'`

### Troubleshooting

**Tests not running?**
- Verify all GitHub Secrets are configured correctly
- Check the Actions tab for error logs
- Ensure the repository has Actions enabled

**Email not received?**
- Verify `EMAIL_USERNAME` and `EMAIL_PASSWORD` are correct
- Check spam/junk folder
- Verify you're using an app password if 2FA is enabled
- Check GitHub Actions logs for email sending errors

**Need to stop automated runs?**
- Go to `.github/workflows/daily-tests.yml`
- Comment out or remove the `schedule:` section
- Commit and push the change

---

## 📊 Performance Metrics

### Key Performance Indicators (KPIs)

| Metric | Target | Excellent |
|--------|--------|-----------|
| Average Redirect Time | < 2000ms | < 1000ms |
| API Response Time | < 500ms | < 200ms |
| Success Rate | 100% | 100% |
| Correct Link Selection | 100% | 100% |

### Performance Monitoring Script

Copy this script into your browser console for automated performance tracking:

```javascript
(function() {
  window.trackingLinkPerformance = {
    tests: [],
    currentTest: null
  };
  
  // Start test
  window.startTest = function(testName) {
    window.trackingLinkPerformance.currentTest = {
      name: testName,
      startTime: Date.now(),
      clickTime: null,
      redirectTime: null,
      finalUrl: null
    };
    console.log('🧪 Test started:', testName);
  };
  
  // Record click
  document.addEventListener('click', function(e) {
    if (e.target.closest('[class*="cta"]') || e.target.closest('button')) {
      if (window.trackingLinkPerformance.currentTest) {
        window.trackingLinkPerformance.currentTest.clickTime = Date.now();
        console.log('🖱️  CTA clicked');
      }
    }
  });
  
  // End test
  window.endTest = function() {
    const test = window.trackingLinkPerformance.currentTest;
    if (test) {
      test.finalUrl = window.location.href;
      test.redirectTime = Date.now() - test.clickTime;
      window.trackingLinkPerformance.tests.push(test);
      
      console.log('✅ Test completed:');
      console.log('   Name:', test.name);
      console.log('   Redirect Time:', test.redirectTime, 'ms');
      console.log('   Final URL:', test.finalUrl);
      
      window.trackingLinkPerformance.currentTest = null;
    }
  };
  
  // Show all results
  window.showResults = function() {
    console.table(window.trackingLinkPerformance.tests);
    const avg = window.trackingLinkPerformance.tests.reduce((sum, t) => sum + t.redirectTime, 0) / window.trackingLinkPerformance.tests.length;
    console.log('Average Redirect Time:', avg.toFixed(2), 'ms');
  };
  
  console.log('📊 Performance monitoring loaded!');
  console.log('Usage:');
  console.log('  startTest("Test Name") - before clicking CTA');
  console.log('  endTest() - after redirect completes');
  console.log('  showResults() - view all results');
})();
```

**Usage:**
```javascript
// Before Test 1
startTest("TL-001: US Country Match");
// [Click CTA]
// [After redirect]
endTest();

// Repeat for each test...

// After all tests
showResults();
```

---

## 📝 Test Report

The test results should be documented in **TEST_REPORT.md**. Fill in the actual results section for each test case with:

1. Final redirect URL
2. Redirect time in milliseconds
3. Tracking link ID used
4. Whether expected attributes were matched
5. PASS/FAIL verdict
6. Any notes or observations

---

## 🔧 Troubleshooting

### Common Issues

**Issue: Cannot access staging site**
- **Solution:** Ensure Cloudflare credentials are correctly configured
- Verify you're using the correct CF Access headers

**Issue: Shortcodes not rendering**
- **Solution:** Check that the NextWork plugin is active in WordPress
- Verify shortcode syntax is correct (no typos)

**Issue: Redirect timing inconsistent**
- **Solution:** Test under different network conditions
- Use Fast 3G throttling in DevTools for consistent testing
- Clear cache between tests

**Issue: Cannot determine tracking link ID**
- **Solution:** Check Network tab for API responses
- Look for tracking link in redirect chain
- Check browser console for logged data

---

## 📚 Files in This Repository

- **tlapi.md** - Original task description
- **TEST_REPORT.md** - Comprehensive test report template
- **tracking-link-test.js** - Main test automation script
- **test-config.js** - Test scenario configurations
- **comprehensive-test-guide.js** - Detailed testing guide
- **browser-automation-guide.js** - Browser automation instructions
- **.env** - Environment configuration (credentials)
- **package.json** - Node.js dependencies
- **README.md** - This file

---

## 🎯 Next Steps

1. ✅ Create WordPress test page with all 5 shortcodes
2. ✅ Execute each test scenario manually
3. ✅ Record results in TEST_REPORT.md
4. ✅ Calculate performance metrics
5. ✅ Generate final QA report
6. ✅ Share findings with development team

---

## 📞 Support & Questions

For questions or issues with the test suite, please contact:
- **QA Engineer:** ronaldo@doualadigitalimpact.com
- **API Documentation:** tracking_key_generation_v2 (1).docx

---

## 📄 License

Internal QA Testing - Confidential

---

**Last Updated:** ${new Date().toISOString()}  
**Version:** 1.0.0  
**Status:** Ready for Execution
