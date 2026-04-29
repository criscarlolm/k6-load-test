/**
 * TCM-10731 | Lawyers Legal Laws - Home Page Load Test
 *
 * Goals:
 *   1. Navigate to the home page URL
 *   2. Verify the main logo element is present and visible
 *   3. Run check assertions on page state
 *   4. Collect browser Web Vitals metrics (TTFB, FCP, LCP, CLS, Load Time)
 *
 * Local run (browser visible, maximized — default):
 *   k6 run --env ENV=production tests/TCM-10731.js
 *
 * Local run (headless, no browser window):
 *   K6_BROWSER_HEADLESS=true k6 run --env ENV=production tests/TCM-10731.js
 *
 * Override environment:
 *   k6 run --env ENV=www3 tests/TCM-10731.js
 *   k6 run --env ENV=www9 tests/TCM-10731.js
 */

import { browser } from 'k6/browser';
import http from 'k6/http';
import { DEFAULTS } from '../config/configurations.js';
import { LawyersLegalLawsHomePage } from '../pages/TCM-10731.js';
import { generateJson, generateHtml } from '../utils/reporter.js';

// ========================
// Test Options
// ========================
export const options = {
    scenarios: {
        browser_test: {
            executor: 'per-vu-iterations',
            options: {
                browser: {
                    type: 'chromium',
                    launchOptions: {
                        headless: (__ENV.K6_BROWSER_HEADLESS === 'true'),
                        args: [
                            '--no-sandbox',
                            '--disable-dev-shm-usage',
                            '--ozone-platform=x11',
                            '--window-size=1920,1080',
                        ]
                    }
                }
            },
            vus: parseInt(__ENV.VUS) || DEFAULTS.VUS || 1,
            iterations: parseInt(__ENV.ITERATIONS) || DEFAULTS.ITERATIONS || 1,
            maxDuration: '3m'
        }
    },
    thresholds: {
        checks: ['rate>=0.9']
    }
};

// ========================
// Summary Report Export + API Push
// ========================
export function handleSummary(data) {
    const testId   = 'TCM-10731';
    const now      = new Date().toISOString();
    const timestamp = now.replace(/[:.]/g, '-').slice(0, 19);
    const basePath  = `report/${testId}_${timestamp}`;

    // ── Build API payload ────────────────────────────────────────────────────
    const m      = data.metrics || {};
    const checks = data.root_group?.checks || [];

    function msStatus(val, good, poor) {
        if (val == null) return 'needs improvement';
        if (val <= good) return 'good';
        if (val <= poor) return 'needs improvement';
        return 'poor';
    }
    function clsStatus(val) {
        if (val == null) return 'needs improvement';
        if (val <= 0.1)  return 'good';
        if (val <= 0.25) return 'needs improvement';
        return 'poor';
    }

    const metrics = [
        { name: 'LCP',  type: 'web-vital', duration: m.browser_web_vital_lcp?.values?.avg  || 0, timestamp: now, threshold: 2500, status: msStatus(m.browser_web_vital_lcp?.values?.avg,  2500, 4000) },
        { name: 'FCP',  type: 'web-vital', duration: m.browser_web_vital_fcp?.values?.avg  || 0, timestamp: now, threshold: 1800, status: msStatus(m.browser_web_vital_fcp?.values?.avg,  1800, 3000) },
        { name: 'TTFB', type: 'web-vital', duration: m.browser_web_vital_ttfb?.values?.avg || 0, timestamp: now, threshold: 800,  status: msStatus(m.browser_web_vital_ttfb?.values?.avg, 800,  1800) },
        { name: 'CLS',  type: 'web-vital', duration: (m.browser_web_vital_cls?.values?.avg || 0) * 1000, timestamp: now, threshold: 100, status: clsStatus(m.browser_web_vital_cls?.values?.avg) },
        { name: 'HTTP Req Duration (avg)', type: 'network', duration: m.browser_http_req_duration?.values?.avg || 0, timestamp: now, threshold: 1000, status: msStatus(m.browser_http_req_duration?.values?.avg, 500, 1000) },
        { name: 'HTTP Req Duration p(90)', type: 'network', duration: m.browser_http_req_duration?.values?.['p(90)'] || 0, timestamp: now, threshold: 1500, status: msStatus(m.browser_http_req_duration?.values?.['p(90)'], 800, 1500) },
        { name: 'Iteration Duration',      type: 'execution', duration: m.iteration_duration?.values?.avg || 0, timestamp: now, threshold: 30000, status: (m.iteration_duration?.values?.avg || 0) <= 30000 ? 'good' : 'poor' },
    ];

    const checksPassed = m.checks?.values?.passes || 0;
    const checksFailed = m.checks?.values?.fails   || 0;

    const payload = {
        reportId:    `${testId}_${timestamp}`,
        metrics,
        testSuites: [{
            name:         testId,
            metrics,
            startTime:    now,
            endTime:      now,
            duration:     data.state?.testRunDurationMs || 0,
            passCount:    checksPassed,
            failCount:    checksFailed,
            warningCount: 0,
        }],
        generatedAt: now,
        rawData:     data,
    };

    // ── POST to dashboard API ────────────────────────────────────────────────
    const apiUrl = __ENV.DASHBOARD_API || 'http://10.0.6.216:3001/api/reports/k6';
    let apiMsg   = '';
    try {
        const res = http.post(apiUrl, JSON.stringify(payload), {
            headers: { 'Content-Type': 'application/json' },
        });
        if (res.status === 201) {
            apiMsg = `✅ Report exported to dashboard API (${apiUrl})\n`;
        } else if (res.status === 409) {
            apiMsg = `⚠️  Report already exists in API (duplicate reportId)\n`;
        } else {
            apiMsg = `⚠️  API responded with status ${res.status}: ${res.body}\n`;
        }
    } catch (e) {
        apiMsg = `⚠️  Could not reach dashboard API: ${e.message}\n`;
    }

    return {
        [`${basePath}.json`]: generateJson(data),
        [`${basePath}.html`]: generateHtml(data, testId),
        stdout: `\n✅ Reports saved to k6/report/\n${apiMsg}`,
    };
}

// ========================
// Main Test Execution
// ========================
export default async function () {
    const env = __ENV.ENV || DEFAULTS.ENV || 'production';
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });
    const homePage = new LawyersLegalLawsHomePage(page, env);

    try {
        // Step 1: Navigate to home page URL
        console.log(`[TCM-10731] Navigating to home page (env: ${env})`);
        await homePage.navigateHome();

        // Step 2: Verify main logo element is visible
        console.log('[TCM-10731] Verifying home page element...');
        await homePage.verifyHomePage();

        // Step 3 & 4: Collect browser Web Vitals metrics
        console.log('[TCM-10731] Collecting Web Vitals...');
        await homePage.collectWebVitals();

        await page.waitForTimeout(1000);
        console.log('[TCM-10731] Test completed successfully');
    } catch (error) {
        console.error(`[TCM-10731] Test failed: ${error.message}`);
    } finally {
        await page.close();
    }
}