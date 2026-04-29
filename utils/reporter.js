/**
 * reporter.js
 * Generates JSON and HTML summary reports from k6's handleSummary data.
 * Output files are written to k6/report/
 */

// ========================
// JSON Report
// ========================
export function generateJson(data) {
    return JSON.stringify(data, null, 2);
}

// ========================
// HTML Report
// ========================
// `meta` (optional): { domain, scenario, vus, casesPosted, casesFailed, iterationsTotal }
// Any field that's truthy will be rendered in the report's meta bar / summary.
export function generateHtml(data, testId = 'TCM-10731', meta = {}) {
    const ts = new Date().toISOString();
    const metrics = data.metrics || {};

    // --- Checks: from metrics.checks.values ---
    const checksTotal  = (metrics['checks']?.values?.passes || 0) + (metrics['checks']?.values?.fails || 0);
    const checksPassed = metrics['checks']?.values?.passes || 0;
    const checksFailed = metrics['checks']?.values?.fails  || 0;
    const checksRate   = checksTotal > 0 ? ((checksPassed / checksTotal) * 100).toFixed(2) : '0.00';
    const overallPass  = checksFailed === 0;

    // --- Execution ---
    const iterDuration = ms(metrics['iteration_duration']?.values?.avg);
    const iterations   = metrics['iterations']?.values?.count || 0;
    const vus          = metrics['vus_max']?.values?.max || 0;
    const testDuration = ms(data.state?.testRunDurationMs);

    // --- Network ---
    const browserReceived = bytes(metrics['browser_data_received']?.values?.count);
    const browserSent     = bytes(metrics['browser_data_sent']?.values?.count);
    const reqDurationAvg  = ms(metrics['browser_http_req_duration']?.values?.avg);
    const reqDurationMin  = ms(metrics['browser_http_req_duration']?.values?.min);
    const reqDurationMed  = ms(metrics['browser_http_req_duration']?.values?.med);
    const reqDurationMax  = ms(metrics['browser_http_req_duration']?.values?.max);
    const reqDurationP90  = ms(metrics['browser_http_req_duration']?.values?.['p(90)']);
    const reqDurationP95  = ms(metrics['browser_http_req_duration']?.values?.['p(95)']);
    // browser_http_req_failed: passes = successful reqs, fails = failed reqs
    const reqFailedPasses = metrics['browser_http_req_failed']?.values?.passes || 0;
    const reqFailedFails  = metrics['browser_http_req_failed']?.values?.fails  || 0;
    const reqTotal        = reqFailedPasses + reqFailedFails;
    const reqFailedRate   = reqTotal > 0 ? ((reqFailedFails / reqTotal) * 100).toFixed(2) + '%' : '0.00%';

    // --- Web Vitals (k6 built-in browser metrics, values in ms) ---
    const ttfbVal = metrics['browser_web_vital_ttfb']?.values?.avg;
    const fcpVal  = metrics['browser_web_vital_fcp']?.values?.avg;
    const lcpVal  = metrics['browser_web_vital_lcp']?.values?.avg;
    const clsVal  = metrics['browser_web_vital_cls']?.values?.avg;
    const inpVal  = metrics['browser_web_vital_inp']?.values?.avg;
    // INP and TBT come from custom page.evaluate() checks in root_group
    // We surface them via the named checks in root_group for display
    const rootChecks   = data.root_group?.checks || [];
    const inpCheck     = rootChecks.find(c => c.name === '[CWV] INP <= 200ms');
    const tbtCheck     = rootChecks.find(c => c.name === '[Interim] TBT <= 200ms');

    // --- Thresholds: nested inside each metric ---
    const thresholdRows = Object.entries(metrics)
        .filter(([, v]) => v.thresholds)
        .flatMap(([metricName, v]) =>
            Object.entries(v.thresholds).map(([expr, result]) => {
                const icon = result.ok ? '✓' : '✗';
                const cls  = result.ok ? 'pass' : 'fail';
                return `<tr class="${cls}">
                  <td>${icon}</td>
                  <td><code>${metricName}</code></td>
                  <td>${expr}</td>
                  <td>${result.ok ? 'PASSED' : 'FAILED'}</td>
                </tr>`;
            })
        ).join('\n');

    // --- Individual checks from root_group ---
    const checkRows = rootChecks.map(c => {
        const pass = c.fails === 0;
        return `<tr>
          <td class="${pass ? 'pass' : 'fail'}">${pass ? '✓' : '✗'}</td>
          <td>${c.name}</td>
          <td class="pass">${c.passes}</td>
          <td class="${c.fails > 0 ? 'fail' : 'pass'}">${c.fails}</td>
        </tr>`;
    }).join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${testId} — k6 Performance Report</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; background: #0f1117; color: #e2e8f0; min-height: 100vh; }

    header {
      background: linear-gradient(135deg, #1a1f2e 0%, #252d3d 100%);
      border-bottom: 1px solid #2d3748;
      padding: 24px 40px;
      display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;
    }
    header h1 { font-size: 1.5rem; font-weight: 700; color: #f7fafc; letter-spacing: -0.02em; }
    header h1 span { color: #667eea; }
    .badge {
      padding: 6px 16px; border-radius: 999px; font-size: 0.85rem; font-weight: 600;
      background: ${overallPass ? '#1a4731' : '#4a1a1a'};
      color: ${overallPass ? '#68d391' : '#fc8181'};
      border: 1px solid ${overallPass ? '#276749' : '#742a2a'};
    }

    .meta { padding: 12px 40px; background: #161b27; font-size: 0.8rem; color: #718096; border-bottom: 1px solid #2d3748; display: flex; flex-wrap: wrap; gap: 8px 24px; }

    main { padding: 32px 40px; display: grid; gap: 24px; }

    .section-title { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #4a5568; margin-bottom: -8px; }

    .grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; }
    .grid-3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
    .grid-4 { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; }

    .card {
      background: #1a1f2e; border: 1px solid #2d3748; border-radius: 12px; padding: 24px;
    }
    .card h2 { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #4a5568; margin-bottom: 18px; }

    .stat-card {
      background: #1a1f2e; border: 1px solid #2d3748; border-radius: 12px; padding: 20px; text-align: center;
    }
    .stat-card .label { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.07em; color: #718096; margin-bottom: 8px; }
    .stat-card .value { font-size: 1.55rem; font-weight: 700; color: #f7fafc; line-height: 1; }
    .stat-card .unit  { font-size: 0.72rem; color: #4a5568; margin-top: 4px; }

    /* Web Vitals */
    .vitals-section { display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 20px; }
    .vitals-group { background: #141824; border: 1px solid #2d3748; border-radius: 10px; padding: 20px; }
    .vitals-group h3 { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px; }
    .vitals-group h3.cwv  { color: #667eea; }
    .vitals-group h3.interim { color: #f6ad55; }
    .vitals-group .group-desc { font-size: 0.72rem; color: #4a5568; margin-bottom: 14px; }
    .vital-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 10px; }
    .vital { background: #0f1117; border-radius: 8px; padding: 14px 10px; text-align: center; border: 1px solid #2d3748; }
    .vital .v-label { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.1em; color: #718096; margin-bottom: 6px; }
    .vital .v-value { font-size: 1.3rem; font-weight: 700; }
    .vital .v-target { font-size: 0.62rem; color: #4a5568; margin-top: 4px; }
    .vital.good .v-value { color: #68d391; }
    .vital.warn .v-value { color: #f6ad55; }
    .vital.poor .v-value { color: #fc8181; }
    .vital.na   .v-value { color: #4a5568; }

    /* Tables */
    table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    th { text-align: left; padding: 9px 12px; font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.07em; color: #4a5568; border-bottom: 1px solid #2d3748; }
    td { padding: 9px 12px; border-bottom: 1px solid #1e2535; vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    tr.pass td:first-child { color: #68d391; font-size: 1rem; }
    tr.fail td:first-child { color: #fc8181; font-size: 1rem; }
    td.pass { color: #68d391; }
    td.fail { color: #fc8181; }
    code { font-family: 'Courier New', monospace; font-size: 0.8rem; background: #141824; padding: 2px 6px; border-radius: 4px; color: #a0aec0; }

    /* Checks summary bar */
    .checks-row { display: flex; gap: 32px; margin-bottom: 20px; }
    .cs { text-align: center; }
    .cs .n { font-size: 2.2rem; font-weight: 700; line-height: 1; }
    .cs .l { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.07em; color: #718096; margin-top: 4px; }
    .cs.total  .n { color: #f7fafc; }
    .cs.passed .n { color: #68d391; }
    .cs.failed .n { color: ${checksFailed > 0 ? '#fc8181' : '#68d391'}; }
    .rate-bar { height: 6px; background: #2d3748; border-radius: 3px; overflow: hidden; }
    .rate-bar-fill { height: 100%; border-radius: 3px; background: ${overallPass ? '#48bb78' : '#fc8181'}; width: ${checksRate}%; }

    footer { text-align: center; padding: 20px; font-size: 0.72rem; color: #4a5568; border-top: 1px solid #2d3748; margin-top: 8px; }
  </style>
</head>
<body>

<header>
  <h1>k6 Performance Report &mdash; <span>${testId}</span></h1>
  <span class="badge">${overallPass ? '✓ ALL CHECKS PASSED' : '✗ CHECKS FAILED'}</span>
</header>

<div class="meta">
  <span>📅 ${ts}</span>
  <span>⏱ Total duration: ${testDuration}</span>
  <span>⚡ k6 Browser Test</span>
  <span>🌐 Chromium</span>
  ${meta.domain    ? `<span>🌍 Domain: <strong style="color:#a0aec0">${escapeHtml(meta.domain)}</strong></span>` : ''}
  ${meta.scenario  ? `<span>🎯 Scenario: <strong style="color:#a0aec0">${escapeHtml(meta.scenario)}</strong></span>` : ''}
  ${meta.vus       ? `<span>👥 Target VUs: <strong style="color:#a0aec0">${escapeHtml(String(meta.vus))}</strong></span>` : ''}
</div>

<main>

  <!-- Execution Summary -->
  <div class="grid-4">
    <div class="stat-card">
      <div class="label">Iterations</div>
      <div class="value">${iterations}</div>
    </div>
    <div class="stat-card">
      <div class="label">VUs</div>
      <div class="value">${vus}</div>
    </div>
    <div class="stat-card">
      <div class="label">Avg Iteration</div>
      <div class="value">${iterDuration}</div>
      <div class="unit">per VU</div>
    </div>
    <div class="stat-card">
      <div class="label">Checks Rate</div>
      <div class="value" style="color:${overallPass ? '#68d391' : '#fc8181'}">${checksRate}%</div>
      <div class="unit">${checksPassed} / ${checksTotal} passed</div>
    </div>
    ${(metrics['cases_posted']?.values?.count != null) ? renderCasesPostedTile(metrics['cases_posted'].values.count, metrics['iterations']?.values?.count || 0) : ''}
  </div>

  <!-- Web Vitals -->
  <div class="card">
    <h2>Web Vitals</h2>
    <div class="vitals-section">

      <!-- Core Web Vitals (Success Metrics) -->
      <div class="vitals-group">
        <h3 class="cwv">Core Web Vitals — Success Metrics</h3>
        <div class="group-desc">Official Google CWV thresholds for production readiness</div>
        <div class="vital-grid">
          <div class="vital ${vitalClass(lcpVal, 2500, 4000)}">
            <div class="v-label">LCP</div>
            <div class="v-value">${ms(lcpVal)}</div>
            <div class="v-target">Loading · target ≤ 2.5s</div>
          </div>
          <div class="vital ${inpVal != null ? vitalClass(inpVal, 200, 500) : (inpCheck ? (inpCheck.fails === 0 ? 'good' : 'poor') : 'na')}">
            <div class="v-label">INP</div>
            <div class="v-value">${inpVal != null ? ms(inpVal) : (inpCheck ? (inpCheck.fails === 0 ? '✓' : '✗') : 'N/A')}</div>
            <div class="v-target">Responsiveness · target ≤ 200ms</div>
          </div>
          <div class="vital ${clsClass(clsVal)}">
            <div class="v-label">CLS</div>
            <div class="v-value">${clsVal != null ? clsVal.toFixed(4) : 'N/A'}</div>
            <div class="v-target">Visual Stability · target ≤ 0.1</div>
          </div>
        </div>
      </div>

      <!-- Interim Metrics -->
      <div class="vitals-group">
        <h3 class="interim">Interim Metrics — Progress Indicators</h3>
        <div class="group-desc">Interim indicators tracked alongside Core Web Vitals</div>
        <div class="vital-grid">
          <div class="vital ${vitalClass(lcpVal, 2000, 2500)}">
            <div class="v-label">LCP</div>
            <div class="v-value">${ms(lcpVal)}</div>
            <div class="v-target">Interim target ≤ 2.0s</div>
          </div>
          <div class="vital ${tbtCheck ? (tbtCheck.fails === 0 ? 'good' : 'poor') : 'na'}">
            <div class="v-label">TBT</div>
            <div class="v-value">${tbtCheck ? (tbtCheck.fails === 0 ? '✓ Pass' : '✗ Fail') : 'N/A'}</div>
            <div class="v-target">Blocking · target ≤ 200ms</div>
          </div>
          <div class="vital ${clsClass(clsVal)}">
            <div class="v-label">CLS</div>
            <div class="v-value">${clsVal != null ? clsVal.toFixed(4) : 'N/A'}</div>
            <div class="v-target">Visual Stability · target ≤ 0.1</div>
          </div>
        </div>
      </div>

      <!-- Supporting Metrics -->
      <div class="vitals-group" style="grid-column: 1 / -1;">
        <h3 style="color:#a0aec0">Supporting Metrics</h3>
        <div class="group-desc">Additional timing signals from Navigation &amp; Paint APIs</div>
        <div class="vital-grid">
          <div class="vital ${vitalClass(ttfbVal, 800, 1800)}">
            <div class="v-label">TTFB</div>
            <div class="v-value">${ms(ttfbVal)}</div>
            <div class="v-target">Server response · ≤ 800ms</div>
          </div>
          <div class="vital ${vitalClass(fcpVal, 1800, 3000)}">
            <div class="v-label">FCP</div>
            <div class="v-value">${ms(fcpVal)}</div>
            <div class="v-target">First paint · ≤ 1.8s</div>
          </div>
        </div>
      </div>

    </div>
  </div>

  <div class="grid-2">

    <!-- Checks breakdown -->
    <div class="card">
      <h2>Checks</h2>
      <div class="checks-row">
        <div class="cs total">  <div class="n">${checksTotal}</div>  <div class="l">Total</div>  </div>
        <div class="cs passed"> <div class="n">${checksPassed}</div> <div class="l">Passed</div> </div>
        <div class="cs failed"> <div class="n">${checksFailed}</div> <div class="l">Failed</div> </div>
      </div>
      <div class="rate-bar"><div class="rate-bar-fill"></div></div>
      <br/>
      <table>
        <thead><tr><th></th><th>Check</th><th>Passes</th><th>Fails</th></tr></thead>
        <tbody>${checkRows}</tbody>
      </table>
    </div>

    <!-- Thresholds -->
    <div class="card">
      <h2>Thresholds</h2>
      <table>
        <thead><tr><th></th><th>Metric</th><th>Expression</th><th>Result</th></tr></thead>
        <tbody>${thresholdRows}</tbody>
      </table>
    </div>

  </div>

  <!-- Browser Network -->
  <div class="card">
    <h2>Browser Network</h2>
    <div class="grid-3" style="margin-bottom:16px">
      <div class="stat-card">
        <div class="label">Avg Req Duration</div>
        <div class="value">${reqDurationAvg}</div>
      </div>
      <div class="stat-card">
        <div class="label">p(90)</div>
        <div class="value">${reqDurationP90}</div>
      </div>
      <div class="stat-card">
        <div class="label">p(95)</div>
        <div class="value">${reqDurationP95}</div>
      </div>
    </div>
    <div class="grid-3">
      <div class="stat-card">
        <div class="label">Min / Med / Max</div>
        <div class="value" style="font-size:1rem">${reqDurationMin} / ${reqDurationMed} / ${reqDurationMax}</div>
      </div>
      <div class="stat-card">
        <div class="label">Total Requests</div>
        <div class="value">${reqTotal}</div>
        <div class="unit">failed: <span style="color:${reqFailedFails > 0 ? '#fc8181' : '#68d391'}">${reqFailedRate}</span></div>
      </div>
      <div class="stat-card">
        <div class="label">Data Transfer</div>
        <div class="value" style="font-size:1rem">${browserReceived}</div>
        <div class="unit">↑ ${browserSent} sent</div>
      </div>
    </div>
  </div>

</main>

<footer>Generated by k6 &bull; ${testId} &bull; ${ts}</footer>

</body>
</html>`;
}

// ========================
// Helpers
// ========================
function ms(val) {
    if (val == null) return 'N/A';
    if (val >= 1000) return (val / 1000).toFixed(2) + 's';
    return Math.round(val) + 'ms';
}

function bytes(val) {
    if (val == null) return 'N/A';
    if (val >= 1048576) return (val / 1048576).toFixed(1) + ' MB';
    if (val >= 1024)    return (val / 1024).toFixed(1) + ' kB';
    return val + ' B';
}

function vitalClass(val, good, poor) {
    if (val == null) return '';
    if (val <= good) return 'good';
    if (val <= poor) return 'warn';
    return 'poor';
}

function clsClass(val) {
    if (val == null) return '';
    if (val <= 0.1)  return 'good';
    if (val <= 0.25) return 'warn';
    return 'poor';
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function renderCasesPostedTile(posted, iterations) {
    const failed = Math.max(0, iterations - posted);
    const rate   = iterations > 0 ? Math.round((posted / iterations) * 100) : 0;
    const color  = posted === 0 ? '#fc8181' : failed === 0 ? '#68d391' : '#f6ad55';
    const sub    = iterations > 0
        ? `${rate}% of ${iterations} iter${failed > 0 ? ` · ${failed} failed` : ''}`
        : (failed > 0 ? `${failed} failed` : 'no iterations');
    return `<div class="stat-card">
      <div class="label">Cases Posted</div>
      <div class="value" style="color:${color}">${posted}</div>
      <div class="unit">${sub}</div>
    </div>`;
}
