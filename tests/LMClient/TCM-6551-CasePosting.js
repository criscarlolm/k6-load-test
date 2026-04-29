import { sleep } from 'k6';
import { browser } from 'k6/browser';
import http from 'k6/http';
import { Counter } from 'k6/metrics';
import { SearchAttorneyPage } from '../../pages/CasePosting/SearchAttorneyPage.js';
import { SubCategoryPage } from '../../pages/CasePosting/SubCategoryPage.js';
import { IssueSpecificQuestionsPage } from '../../pages/CasePosting/IssueSpecificQuestionsPage.js';
import { DescriptionPage } from '../../pages/CasePosting/DescriptionPage.js';
import { SaveCasePage } from '../../pages/CasePosting/SaveYourCasePage.js';
import { CostEstimatePage } from '../../pages/CasePosting/CostEstimatePage.js';

import { perVUiterations, rampingScenario, singlePassRamping } from '../../common/scenarios.js';
import { generateJson, generateHtml } from '../../utils/reporter.js';

// Custom counter so the total number of successfully posted cases is recorded
// in the k6 summary (data.metrics.cases_posted.values.count) and exported to
// the dashboard alongside web vitals / network metrics.
const casesPostedCounter = new Counter('cases_posted');

// Switch scenarios via env:
//   SCENARIO=ramping  -> 3-pass ramping (15/25/50)
//   SCENARIO=single   -> single-pass ramping (TARGET env var)
//   (default)         -> per-VU iterations
function pickScenario() {
    switch (__ENV.SCENARIO) {
        case 'ramping': return rampingScenario();
        case 'single':  return singlePassRamping();
        default:        return perVUiterations();
    }
}
export let options = pickScenario();

// ─── Summary report: JSON + HTML to k6/report/ + POST to dashboard API ───────
export function handleSummary(data) {
    const testId    = 'TCM-6551';
    const now       = new Date().toISOString();
    const timestamp = now.replace(/[:.]/g, '-').slice(0, 19);
    const basePath  = `report/${testId}_${timestamp}`;

    const m      = data.metrics || {};

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

    const lcp  = m.browser_web_vital_lcp?.values?.avg;
    const fcp  = m.browser_web_vital_fcp?.values?.avg;
    const ttfb = m.browser_web_vital_ttfb?.values?.avg;
    const cls  = m.browser_web_vital_cls?.values?.avg;
    const reqAvg = m.browser_http_req_duration?.values?.avg;
    const reqP90 = m.browser_http_req_duration?.values?.['p(90)'];
    const iterAvg = m.iteration_duration?.values?.avg;

    const metrics = [
        { name: 'LCP',  type: 'web-vital', duration: lcp  || 0, timestamp: now, threshold: 2500, status: msStatus(lcp,  2500, 4000) },
        { name: 'FCP',  type: 'web-vital', duration: fcp  || 0, timestamp: now, threshold: 1800, status: msStatus(fcp,  1800, 3000) },
        { name: 'TTFB', type: 'web-vital', duration: ttfb || 0, timestamp: now, threshold: 800,  status: msStatus(ttfb, 800,  1800) },
        { name: 'CLS',  type: 'web-vital', duration: (cls || 0) * 1000, timestamp: now, threshold: 100, status: clsStatus(cls) },
        { name: 'HTTP Req Duration (avg)',  type: 'network',   duration: reqAvg  || 0, timestamp: now, threshold: 1000,  status: msStatus(reqAvg, 500, 1000) },
        { name: 'HTTP Req Duration p(90)',  type: 'network',   duration: reqP90  || 0, timestamp: now, threshold: 1500,  status: msStatus(reqP90, 800, 1500) },
        { name: 'Iteration Duration',       type: 'execution', duration: iterAvg || 0, timestamp: now, threshold: 30000, status: (iterAvg || 0) <= 30000 ? 'good' : 'poor' },
    ];

    const checksPassed = m.checks?.values?.passes || 0;
    const checksFailed = m.checks?.values?.fails  || 0;

    // Total successful case postings tracked via the custom Counter metric.
    const casesPosted = m.cases_posted?.values?.count || 0;
    const iterationsTotal = m.iterations?.values?.count || 0;
    const casesFailed = Math.max(0, iterationsTotal - casesPosted);

    metrics.push({
        name: 'Cases Posted', type: 'business', duration: casesPosted,
        timestamp: now, threshold: 0,
        status: casesPosted > 0 && casesFailed === 0 ? 'good'
              : casesPosted > 0 ? 'needs improvement' : 'poor',
    });

    const scenario = __ENV.SCENARIO || 'perVU';
    const target   = __ENV.TARGET || __ENV.VUS || '';
    const reportId = `${testId}_${scenario}${target ? '_' + target : ''}_${timestamp}`;

    const payload = {
        reportId,
        casesPosted,
        casesFailed,
        iterationsTotal,
        metrics,
        testSuites: [{
            name:         `${testId} ${scenario}${target ? ' @' + target + 'VUs' : ''}`,
            metrics,
            startTime:    now,
            endTime:      now,
            duration:     data.state?.testRunDurationMs || 0,
            passCount:    checksPassed,
            failCount:    checksFailed,
            warningCount: 0,
        }],
        generatedAt: now,
        environment: __ENV.DOMAIN || __ENV.ENV || 'production',
        rawData:     data,
    };

    const apiUrl = __ENV.DASHBOARD_API || 'http://10.0.6.216:3001/api/reports/k6';
    let apiMsg = '';
    try {
        const res = http.post(apiUrl, JSON.stringify(payload), {
            headers: { 'Content-Type': 'application/json' },
            tags:    { name: 'dashboard_export' },
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

    const summary =
        `\n✅ Reports saved to k6/report/\n` +
        `   • ${basePath}.json\n` +
        `   • ${basePath}.html\n` +
        `📋 Cases posted: ${casesPosted} / ${iterationsTotal} iterations` +
        (casesFailed > 0 ? ` (${casesFailed} failed)\n` : `\n`) +
        `${apiMsg}` +
        `🔗 View at http://10.0.6.216:3000/k6\n`;

    const domain = __ENV.DOMAIN || __ENV.ENV || '';
    const vusLabel = __ENV.TARGET || __ENV.VUS || (m.vus_max?.values?.max || '');

    return {
        [`${basePath}.json`]: generateJson(data),
        [`${basePath}.html`]: generateHtml(data, testId, {
            domain,
            scenario,
            vus: vusLabel,
            casesPosted,
            casesFailed,
            iterationsTotal,
        }),
        stdout: summary,
    };
}

export default async function () {
    const page = await browser.newPage();

    page.setViewportSize({ width: 1366, height: 768 });

    const searchAttorney = new SearchAttorneyPage(page);
    const subCategory = new SubCategoryPage(page);
    const issueQuestions = new IssueSpecificQuestionsPage(page);
    const description = new DescriptionPage(page);
    const saveCase = new SaveCasePage(page);
    const costEstimate = new CostEstimatePage(page);

    try {
        await searchAttorney.visit();
        await searchAttorney.homePageCheckVerification();
        await searchAttorney.searchForAttorney();
        await subCategory.selectSubCategory();
        await issueQuestions.clickNextButton();
        await description.fillDescription();
        await saveCase.fillCaseDetails();

        const caseNumber = await costEstimate.completeCostEstimate();

        // Special parseable marker for the wrapper script to extract
        if (caseNumber && caseNumber !== 'unknown') {
            console.log(`[CASE_POSTED] caseNumber=${caseNumber} vu=${__VU} iteration=${__ITER + 1}`);
            casesPostedCounter.add(1, { caseNumber: String(caseNumber) });
        }

        sleep(1);
    } catch (error) {
        console.error('Test failed due to error:', error.message || error);
        console.log('Error stack trace:', error.stack || 'No stack trace available');
    } finally {
        if (page) {
            try {
                await page.close();
                console.log('Page closed successfully');
            } catch (closeError) {
                console.warn('Failed to close the page:', closeError);
            }
        }
    }
}
