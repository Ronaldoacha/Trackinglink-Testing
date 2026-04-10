const fs = require('fs');
const path = require('path');

function generateBeautifulReport(results) {
  const timestamp = new Date().toLocaleString();
  const successfulTests = results.filter(r => r.status === 'SUCCESS');
  const failedTests = results.filter(r => r.status === 'REDIRECT_ERROR' || r.status === 'FAILED');
  const successRate = ((successfulTests.length / results.length) * 100).toFixed(1);
  
  // Calculate performance metrics (convert from ms to seconds)
  const redirectTimes = successfulTests.map(r => r.redirectTime).filter(t => t);
  const avgRedirectTime = redirectTimes.length > 0 
    ? ((redirectTimes.reduce((a, b) => a + b, 0) / redirectTimes.length) / 1000).toFixed(2)
    : 0;
  const fastestRedirect = redirectTimes.length > 0 ? (Math.min(...redirectTimes) / 1000).toFixed(2) : 0;
  const slowestRedirect = redirectTimes.length > 0 ? (Math.max(...redirectTimes) / 1000).toFixed(2) : 0;
  const totalRedirectTime = redirectTimes.length > 0 ? (redirectTimes.reduce((a, b) => a + b, 0) / 1000).toFixed(2) : 0;
  
  // Calculate detailed statistics
  const totalNetworkEvents = results.reduce((sum, r) => sum + (r.networkEventsCount || 0), 0);
  const totalUrlsCaptured = results.reduce((sum, r) => sum + (r.totalUrlsCaptured || 0), 0);
  const avgNetworkEvents = results.length > 0 ? (totalNetworkEvents / results.length).toFixed(1) : 0;
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tracking Links Test Report - ${timestamp}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 40px 20px;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            font-weight: 700;
        }
        
        .header .timestamp {
            font-size: 1.1em;
            opacity: 0.9;
        }
        
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            padding: 40px;
            background: #f8f9fa;
        }
        
        .summary-card {
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            text-align: center;
            border-left: 5px solid;
        }
        
        .summary-card.success {
            border-left-color: #10b981;
        }
        
        .summary-card.failed {
            border-left-color: #ef4444;
        }
        
        .summary-card.total {
            border-left-color: #3b82f6;
        }
        
        .summary-card.time {
            border-left-color: #f59e0b;
        }
        
        .summary-card .number {
            font-size: 3em;
            font-weight: 700;
            margin: 10px 0;
        }
        
        .summary-card .label {
            font-size: 0.9em;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 600;
        }
        
        .success-rate {
            padding: 40px;
            text-align: center;
            background: white;
        }
        
        .success-rate h2 {
            font-size: 1.8em;
            margin-bottom: 20px;
            color: #1f2937;
        }
        
        .progress-bar {
            width: 100%;
            height: 40px;
            background: #e5e7eb;
            border-radius: 20px;
            overflow: hidden;
            position: relative;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #10b981 0%, #059669 100%);
            transition: width 1s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 700;
            font-size: 1.2em;
        }
        
        .progress-fill.warning {
            background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%);
        }
        
        .progress-fill.danger {
            background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%);
        }
        
        .performance-metrics {
            padding: 40px;
            background: #f8f9fa;
        }
        
        .performance-metrics h2 {
            font-size: 1.8em;
            margin-bottom: 30px;
            color: #1f2937;
            text-align: center;
        }
        
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
        }
        
        .metric-card {
            background: white;
            padding: 25px;
            border-radius: 12px;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .metric-card .metric-value {
            font-size: 2em;
            font-weight: 700;
            color: #667eea;
            margin: 10px 0;
        }
        
        .metric-card .metric-label {
            font-size: 0.9em;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .results-section {
            padding: 40px;
        }
        
        .results-section h2 {
            font-size: 1.8em;
            margin-bottom: 30px;
            color: #1f2937;
        }
        
        .test-card {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 25px;
            margin-bottom: 20px;
            transition: all 0.3s ease;
        }
        
        .test-card:hover {
            box-shadow: 0 8px 16px rgba(0,0,0,0.1);
            transform: translateY(-2px);
        }
        
        .test-card.success {
            border-left: 5px solid #10b981;
        }
        
        .test-card.failed {
            border-left: 5px solid #ef4444;
        }
        
        .test-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            flex-wrap: wrap;
            gap: 10px;
        }
        
        .test-id {
            font-size: 1.3em;
            font-weight: 700;
            color: #1f2937;
        }
        
        .status-badge {
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .status-badge.success {
            background: #d1fae5;
            color: #065f46;
        }
        
        .status-badge.failed {
            background: #fee2e2;
            color: #991b1b;
        }
        
        .test-details {
            display: grid;
            gap: 12px;
            margin-top: 15px;
        }
        
        .detail-row {
            display: grid;
            grid-template-columns: 150px 1fr;
            gap: 15px;
            padding: 10px;
            background: #f9fafb;
            border-radius: 8px;
        }
        
        .detail-label {
            font-weight: 600;
            color: #6b7280;
            font-size: 0.9em;
        }
        
        .detail-value {
            color: #1f2937;
            word-break: break-all;
        }
        
        .detail-value.url {
            color: #3b82f6;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
        }
        
        .detail-value.time {
            color: #f59e0b;
            font-weight: 600;
        }
        
        .error-message {
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 8px;
            padding: 15px;
            margin-top: 15px;
            color: #991b1b;
        }
        
        .tabs {
            display: flex;
            gap: 10px;
            padding: 40px 40px 0 40px;
            background: white;
        }
        
        .tab {
            padding: 15px 30px;
            border: none;
            background: #e5e7eb;
            color: #6b7280;
            font-weight: 600;
            cursor: pointer;
            border-radius: 8px 8px 0 0;
            transition: all 0.3s;
        }
        
        .tab.active {
            background: #667eea;
            color: white;
        }
        
        .tab-content {
            display: none;
        }
        
        .tab-content.active {
            display: block;
        }
        
        .footer {
            background: #1f2937;
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .export-buttons {
            display: flex;
            justify-content: center;
            gap: 15px;
            padding: 30px;
            background: #f8f9fa;
        }
        
        .btn {
            padding: 12px 30px;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            font-size: 1em;
        }
        
        .btn-primary {
            background: #667eea;
            color: white;
        }
        
        .btn-primary:hover {
            background: #5568d3;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        
        .btn-secondary {
            background: #6b7280;
            color: white;
        }
        
        .btn-secondary:hover {
            background: #4b5563;
            transform: translateY(-2px);
        }
        
        @media print {
            body {
                background: white;
                padding: 0;
            }
            
            .container {
                box-shadow: none;
            }
            
            .test-card:hover {
                transform: none;
            }
            
            .export-buttons {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔗 Tracking Links Test Report</h1>
            <div class="timestamp">📅 Test Executed: ${timestamp}</div>
            <div class="timestamp" style="margin-top: 10px; font-size: 0.95em;">
                📊 Automated redirect validation and performance testing
            </div>
        </div>
        
        <div class="summary-grid">
            <div class="summary-card total">
                <div class="label">Total Tests Executed</div>
                <div class="number">${results.length}</div>
                <div style="font-size: 0.85em; margin-top: 8px; color: #6b7280;">
                    CTAs tested on page
                </div>
            </div>
            <div class="summary-card success">
                <div class="label">✅ Successful Redirects</div>
                <div class="number">${successfulTests.length}</div>
                <div style="font-size: 0.85em; margin-top: 8px; color: #059669;">
                    Valid URLs captured
                </div>
            </div>
            <div class="summary-card failed">
                <div class="label">❌ Failed Tests</div>
                <div class="number">${failedTests.length}</div>
                <div style="font-size: 0.85em; margin-top: 8px; color: #dc2626;">
                    No valid redirect found
                </div>
            </div>
            <div class="summary-card time">
                <div class="label">⏱️ Average Redirect Time</div>
                <div class="number">${avgRedirectTime}s</div>
                <div style="font-size: 0.85em; margin-top: 8px; color: #d97706;">
                    Mean time to final URL
                </div>
            </div>
        </div>
        
        <div class="success-rate">
            <h2>Overall Success Rate</h2>
            <p style="color: #6b7280; margin-bottom: 20px;">
                Percentage of tracking links that successfully redirected to valid destination URLs
            </p>
            <div class="progress-bar">
                <div class="progress-fill ${successRate >= 80 ? '' : successRate >= 50 ? 'warning' : 'danger'}" style="width: ${successRate}%">
                    ${successRate}%
                </div>
            </div>
            <div style="margin-top: 15px; font-size: 0.9em; color: #6b7280;">
                ${successRate >= 80 ? '🟢 Excellent - Most tracking links working correctly' : 
                  successRate >= 50 ? '🟡 Warning - Some tracking links may need attention' : 
                  '🔴 Critical - Many tracking links are not functioning properly'}
            </div>
        </div>
        
        ${redirectTimes.length > 0 ? `
        <div class="performance-metrics">
            <h2>📈 Performance Metrics & Network Activity</h2>
            <p style="color: #6b7280; margin-bottom: 20px; text-align: center;">
                Detailed breakdown of redirect timings and network monitoring data
            </p>
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-label">📊 Average Time</div>
                    <div class="metric-value">${avgRedirectTime}s</div>
                    <div style="font-size: 0.8em; color: #6b7280; margin-top: 5px;">Mean redirect duration</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">⚡ Fastest Redirect</div>
                    <div class="metric-value">${fastestRedirect}s</div>
                    <div style="font-size: 0.8em; color: #6b7280; margin-top: 5px;">Quickest completion time</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">🐢 Slowest Redirect</div>
                    <div class="metric-value">${slowestRedirect}s</div>
                    <div style="font-size: 0.8em; color: #6b7280; margin-top: 5px;">Longest completion time</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">⏰ Total Duration</div>
                    <div class="metric-value">${totalRedirectTime}s</div>
                    <div style="font-size: 0.8em; color: #6b7280; margin-top: 5px;">Combined test time</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">🌐 Network Events</div>
                    <div class="metric-value">${totalNetworkEvents}</div>
                    <div style="font-size: 0.8em; color: #6b7280; margin-top: 5px;">Total HTTP requests captured</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">📡 Avg Events/Test</div>
                    <div class="metric-value">${avgNetworkEvents}</div>
                    <div style="font-size: 0.8em; color: #6b7280; margin-top: 5px;">Mean network activity per CTA</div>
                </div>
            </div>
        </div>
        ` : ''}
        
        <div class="tabs">
            <button class="tab active" onclick="showTab('all')">📋 All Tests (${results.length})</button>
            <button class="tab" onclick="showTab('success')">✅ Successful Redirects (${successfulTests.length})</button>
            <button class="tab" onclick="showTab('failed')">❌ Failed Tests (${failedTests.length})</button>
        </div>
        
        <div class="results-section">
            <div id="tab-all" class="tab-content active">
                <h2>📋 All Test Results</h2>
                <p style="color: #6b7280; margin-bottom: 25px;">
                    Complete list of all ${results.length} tracking link tests including both successful and failed attempts
                </p>
                ${results.map((result, index) => generateTestCard(result, index + 1)).join('')}
            </div>
            
            <div id="tab-success" class="tab-content">
                <h2>✅ Successful Redirect Tests</h2>
                <p style="color: #059669; margin-bottom: 25px;">
                    Tests that successfully captured valid destination URLs (${successfulTests.length} of ${results.length})
                </p>
                ${successfulTests.length > 0 ? successfulTests.map((result, index) => generateTestCard(result, index + 1)).join('') : '<p style="text-align: center; color: #6b7280; padding: 40px;">No successful tests found. All tracking links failed to redirect properly.</p>'}
            </div>
            
            <div id="tab-failed" class="tab-content">
                <h2>❌ Failed Redirect Tests</h2>
                <p style="color: #dc2626; margin-bottom: 25px;">
                    Tests that did not capture valid redirect URLs - possible tracking link issues (${failedTests.length} of ${results.length})
                </p>
                ${failedTests.length > 0 ? failedTests.map((result, index) => generateTestCard(result, index + 1)).join('') : '<p style="text-align: center; color: #10b981; padding: 40px;">🎉 Excellent! All tracking links redirected successfully.</p>'}
            </div>
        </div>
        
        <div class="export-buttons">
            <button class="btn btn-primary" onclick="window.print()">🖨️ Print PDF Report</button>
            <button class="btn btn-secondary" onclick="exportToJSON()">📊 Export Test Data (JSON)</button>
            <button class="btn btn-secondary" onclick="exportToCSV()">📄 Export Spreadsheet (CSV)</button>
        </div>
        
        <div class="footer">
            <p>🔗 Tracking Link Test Report | Automated Test Suite | Generated: ${timestamp}</p>
            <p style="margin-top: 10px; opacity: 0.8; font-size: 0.9em;">Powered by Playwright</p>
        </div>
    </div>
    
    <script>
        const testData = ${JSON.stringify(results)};
        
        function showTab(tabName) {
            // Hide all tabs
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.querySelectorAll('.tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Show selected tab
            document.getElementById('tab-' + tabName).classList.add('active');
            event.target.classList.add('active');
        }
        
        function exportToJSON() {
            const dataStr = JSON.stringify(testData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'test-results-' + new Date().toISOString().slice(0,10) + '.json';
            link.click();
        }
        
        function exportToCSV() {
            const headers = ['Test ID', 'Text', 'Status', 'Final URL', 'Redirect Time (ms)', 'Original Href'];
            const rows = testData.map(r => [
                r.testId || 'N/A',
                r.text || '',
                r.status,
                r.finalUrl || '',
                r.redirectTime || '',
                r.originalHref || ''
            ]);
            
            const csv = [headers, ...rows].map(row => 
                row.map(cell => '"' + String(cell).replace(/"/g, '""') + '"').join(',')
            ).join('\\n');
            
            const dataBlob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'test-results-' + new Date().toISOString().slice(0,10) + '.csv';
            link.click();
        }
    </script>
</body>
</html>
`;

  return html;
}

function generateTestCard(result, index) {
  const isSuccess = result.status === 'SUCCESS';
  const statusClass = isSuccess ? 'success' : 'failed';
  const statusText = isSuccess ? '✅ Redirect Successful' : '❌ Redirect Failed';
  const statusIcon = isSuccess ? '✅' : '❌';
  
  return `
    <div class="test-card ${statusClass}">
        <div class="test-header">
            <div class="test-id">${statusIcon} Test #${index}: ${result.testId || 'N/A'}</div>
            <span class="status-badge ${statusClass}">${statusText}</span>
        </div>
        
        <div class="test-details">
            ${result.text ? `
            <div class="detail-row">
                <div class="detail-label">🎯 CTA Button Text:</div>
                <div class="detail-value">"${result.text}"</div>
            </div>
            ` : ''}
            
            ${result.originalHref ? `
            <div class="detail-row">
                <div class="detail-label">🔗 Original Tracking Link:</div>
                <div class="detail-value url">${result.originalHref.substring(0, 100)}${result.originalHref.length > 100 ? '...' : ''}</div>
            </div>
            ` : ''}
            
            ${result.finalUrl && isSuccess ? `
            <div class="detail-row">
                <div class="detail-label">🌐 Final Destination URL:</div>
                <div class="detail-value url"><strong>${result.finalUrl}</strong></div>
            </div>
            ` : ''}
            
            ${result.redirectTime ? `
            <div class="detail-row">
                <div class="detail-label">⏱️ Total Redirect Time:</div>
                <div class="detail-value time"><strong>${(result.redirectTime / 1000).toFixed(2)}s</strong> (time from click to final URL)</div>
            </div>
            ` : ''}
            
            ${result.totalUrlsCaptured !== undefined ? `
            <div class="detail-row">
                <div class="detail-label">📍 URLs Captured During Test:</div>
                <div class="detail-value">${result.totalUrlsCaptured} URL${result.totalUrlsCaptured !== 1 ? 's' : ''} detected in redirect chain</div>
            </div>
            ` : ''}
            
            ${result.networkEventsCount !== undefined ? `
            <div class="detail-row">
                <div class="detail-label">🌐 Network Activity:</div>
                <div class="detail-value">${result.networkEventsCount} HTTP request${result.networkEventsCount !== 1 ? 's' : ''} monitored</div>
            </div>
            ` : ''}
        </div>
        
        ${result.error ? `
        <div class="error-message">
            <strong>⚠️ Error Details:</strong> ${result.error}
        </div>
        ` : ''}
        
        ${!isSuccess && result.finalUrl && result.finalUrl.includes('chrome-error') ? `
        <div class="error-message">
            <strong>🚨 Diagnosis:</strong> Redirect failed - No valid destination URL was captured. 
            <br><strong>Possible causes:</strong> The tracking link may be misconfigured, expired, broken, or blocked by security settings.
            <br><strong>Network activity:</strong> ${result.networkEventsCount || 0} HTTP requests detected (${result.networkEventsCount === 0 ? 'indicates tracking link not responding' : 'but no valid URL found'}).
        </div>
        ` : ''}
    </div>
  `;
}

module.exports = { generateBeautifulReport };
