# k6 Browser Performance Testing Guide

Browser-level performance testing for **Lawyers Legal Laws** using [k6](https://k6.io/) with the [k6 Browser module](https://grafana.com/docs/k6/latest/using-k6-browser/).

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Folder Structure](#folder-structure)
- [Environments](#environments)
- [Running Tests](#running-tests)
  - [Default Run (Browser Visible)](#default-run-browser-visible)
  - [Headless Run](#headless-run)
  - [Override Environment](#override-environment)
  - [Override VUs and Iterations](#override-vus-and-iterations)
  - [Export to Local Dashboard API](#export-to-local-dashboard-api)
- [Test Flow](#test-flow)
- [Web Vitals Collected](#web-vitals-collected)
- [Check Thresholds](#check-thresholds)
- [Reports](#reports)
  - [HTML Report](#html-report)
  - [JSON Report](#json-report)
  - [Dashboard API Export](#dashboard-api-export)
- [Configuration Reference](#configuration-reference)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| k6 | ≥ v0.46 | Must include browser module support |
| Node.js | ≥ 18 | Only needed for dashboard server |
| Chromium | bundled | k6 ships its own Chromium |

Install k6 on Linux:

```bash
sudo gpg -k
sudo gpg --no-default-keyring \
  --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
  --keyserver hkp://keyserver.ubuntu.com:80 \
  --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" \
  | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6
```

Verify installation:

```bash
k6 version
```

---

## Installation

No `npm install` needed — k6 is a standalone binary. Just clone the repo and run from the `k6/` directory.

```bash
cd k6/
```

---

## Folder Structure

```
k6/
├── config/
│   └── configurations.js        # Default VUs, iterations, timeout, environment
├── common/
│   ├── perVUiterations.js        # Shared per-VU iteration scenario helper
│   └── scenarios.js              # Reusable scenario configurations
├── data/
│   ├── environments.json         # URLs and selectors per environment
│   └── data.js                   # Shared test data helpers
├── pages/
│   └── TCM-10731.js              # Page Object — navigation, verification, Web Vitals
├── tests/
│   └── TCM-10731.js              # Main test script
├── utils/
│   └── reporter.js               # HTML + JSON report generator
├── report/                       # Generated reports after each test run
└── TESTING_GUIDE.md              # This file
```

---

## Environments

Defined in `data/environments.json`. Each environment has a `baseUrl` and element `selectors`.

| Environment | URL |
|-------------|-----|
| `production` | `https://www.lawyerslegallaws.com/` |
| `www3` | `https://lawyerslegallaws3.aws.legalmatch.com` |
| `www9` | `https://lawyerslegallaws9.aws.legalmatch.com/` |

Switch environment with `--env ENV=<name>` at runtime.

---

## Running Tests

All commands are run from the **`k6/` directory**.

### Default Run (Browser Visible)

Opens a real Chromium browser window at 1920×1080 and runs the test:

```bash
k6 run --env ENV=production tests/TCM-10731.js
```

On **Linux with Wayland**, prefix with `DISPLAY=:0`:

```bash
DISPLAY=:0 k6 run --env ENV=production tests/TCM-10731.js
```

---

### Headless Run

No browser window — useful for CI pipelines:

```bash
K6_BROWSER_HEADLESS=true k6 run --env ENV=production tests/TCM-10731.js
```

---

### Override Environment

```bash
# Staging environment www3
k6 run --env ENV=www3 tests/TCM-10731.js

# Staging environment www9
k6 run --env ENV=www9 tests/TCM-10731.js
```

---

### Override VUs and Iterations

```bash
# 3 virtual users, 2 iterations each
k6 run --env ENV=production --env VUS=3 --env ITERATIONS=2 tests/TCM-10731.js
```

---

### Export to Local Dashboard API

By default the test posts results to `http://10.0.6.216:3001/api/reports/k6`.  
Override with `--env DASHBOARD_API` to point to a local server:

```bash
k6 run --env ENV=production \
  --env DASHBOARD_API=http://localhost:3001/api/reports/k6 \
  tests/TCM-10731.js
```

---

## Test Flow

Each test iteration runs the following steps in order:

```
1. Open Chromium browser (1920×1080 viewport)
   │
2. Navigate to baseUrl (waitUntil: networkidle)
   │
3. Verify logo element is visible
   │   Selector: img[alt='Lawyers Legal Laws']
   │   Check: 'Home page logo is visible'
   │
4. Collect Web Vitals via PerformanceObserver + Navigation Timing API
   │   Metrics: TTFB, FCP, LCP, INP, TBT, CLS, Load Time
   │   Checks: Core Web Vitals, Interim Metrics, Supporting Metrics
   │
5. Wait 1 second (allow late metrics to settle)
   │
6. Close browser page
   │
7. handleSummary() — on test completion:
   ├── Save report/TCM-10731_<timestamp>.html
   ├── Save report/TCM-10731_<timestamp>.json
   └── POST results to Dashboard API
```

---

## Web Vitals Collected

Metrics are collected using the browser's native `PerformanceObserver` and Navigation Timing API inside `page.evaluate()`.

| Metric | Source | Description |
|--------|--------|-------------|
| **TTFB** | Navigation Timing | Time to First Byte — server response time |
| **FCP** | Paint API | First Contentful Paint — first visible content |
| **LCP** | PerformanceObserver | Largest Contentful Paint — main content loaded |
| **INP** | PerformanceObserver (`event`) | Interaction to Next Paint — responsiveness |
| **TBT** | PerformanceObserver (`longtask`) | Total Blocking Time — main thread blocking |
| **CLS** | PerformanceObserver (`layout-shift`) | Cumulative Layout Shift — visual stability |
| **Load Time** | Navigation Timing | Full page load event |

k6 also captures these built-in browser metrics automatically:

| k6 Metric | Description |
|-----------|-------------|
| `browser_web_vital_lcp` | LCP (ms) |
| `browser_web_vital_fcp` | FCP (ms) |
| `browser_web_vital_ttfb` | TTFB (ms) |
| `browser_web_vital_cls` | CLS (score) |
| `browser_http_req_duration` | HTTP request duration (avg, p90, p95) |
| `browser_data_received` | Total bytes received |
| `browser_data_sent` | Total bytes sent |

---

## Check Thresholds

Checks are assertions evaluated at runtime. The test fails if the overall check pass rate falls below `90%` (`rate>=0.9`).

### Core Web Vitals — Success Metrics

| Check | Threshold | Metric |
|-------|-----------|--------|
| `[CWV] LCP <= 2500ms` | ≤ 2,500ms | Loading performance |
| `[CWV] INP <= 200ms` | ≤ 200ms | Responsiveness |
| `[CWV] CLS <= 0.1` | ≤ 0.1 | Visual stability |

### Interim Metrics — Progress Indicators

| Check | Threshold | Metric |
|-------|-----------|--------|
| `[Interim] LCP <= 2000ms` | ≤ 2,000ms | Stricter LCP target |
| `[Interim] TBT <= 200ms` | ≤ 200ms | Main thread blocking |
| `[Interim] CLS <= 0.1` | ≤ 0.1 | Visual stability |

### Supporting Metrics

| Check | Threshold | Metric |
|-------|-----------|--------|
| `TTFB <= 800ms` | ≤ 800ms | Server response |
| `FCP <= 2500ms` | ≤ 2,500ms | First paint |
| `Page Load Time <= 5000ms` | ≤ 5,000ms | Full page load |

### Global Threshold

```js
thresholds: {
  checks: ['rate>=0.9']   // ≥ 90% of all checks must pass
}
```

---

## Reports

After each test run, two files are saved to `k6/report/`:

```
report/
├── TCM-10731_2026-03-05T07-30-00.html   ← Styled HTML report
└── TCM-10731_2026-03-05T07-30-00.json   ← Raw k6 summary JSON
```

### HTML Report

Open directly in any browser:

```bash
xdg-open report/TCM-10731_<timestamp>.html
```

The HTML report includes:

- **Header** — Test ID, overall pass/fail badge
- **Meta bar** — Timestamp, total duration, browser
- **Execution Summary** — Iterations, VUs, avg iteration time, checks rate
- **Web Vitals** — Three groups: Core CWV, Interim Metrics, Supporting Metrics
- **Checks** — Pass/fail count, progress bar, individual check table
- **Thresholds** — All threshold expressions and results
- **Browser Network** — Avg/p90/p95 request duration, data transfer, failed request rate

### JSON Report

The raw k6 summary data — contains all metrics, checks, thresholds, and state:

```bash
cat report/TCM-10731_<timestamp>.json | jq '.metrics.browser_web_vital_lcp'
```

### Dashboard API Export

Results are automatically POSTed to the dashboard API at the end of each run.

**Default endpoint:** `http://10.0.6.216:3001/api/reports/k6`

Console output after the test:

```
✅ Reports saved to k6/report/
✅ Report exported to dashboard API (http://10.0.6.216:3001/api/reports/k6)
```

If the API is unreachable:

```
⚠️  Could not reach dashboard API: ...
```

If the report already exists (duplicate `reportId`):

```
⚠️  Report already exists in API (duplicate reportId)
```

View exported reports in the dashboard at `http://localhost:3000/k6`.

---

## Configuration Reference

### `config/configurations.js`

```js
export const DEFAULTS = {
  ENV:        'production',  // default environment
  VUS:        1,             // virtual users
  ITERATIONS: 1,             // iterations per VU
  TIMEOUT:    30000,         // element wait timeout (ms)
};
```

### `data/environments.json`

```json
{
  "production": {
    "baseUrl": "https://www.lawyerslegallaws.com/",
    "selectors": {
      "mainHeadingLogo": "img[alt='Lawyers Legal Laws']"
    }
  }
}
```

### Test options (in `tests/TCM-10731.js`)

| Option | Default | Override with |
|--------|---------|---------------|
| Environment | `production` | `--env ENV=www3` |
| VUs | `1` | `--env VUS=3` |
| Iterations | `1` | `--env ITERATIONS=2` |
| Headless | `false` | `K6_BROWSER_HEADLESS=true` |
| Dashboard API | `http://10.0.6.216:3001/api/reports/k6` | `--env DASHBOARD_API=<url>` |
| Max duration | `3m` | Edit `maxDuration` in options |

---

## Troubleshooting

### Browser window does not open

Make sure `K6_BROWSER_HEADLESS` is not set to `true`:

```bash
# Explicitly force headed
k6 run --env ENV=production tests/TCM-10731.js
```

On Linux with Wayland, the browser needs `DISPLAY=:0`:

```bash
DISPLAY=:0 k6 run --env ENV=production tests/TCM-10731.js
```

---

### `could not load JS test: ... Unexpected token`

k6 does not support ES module `import` for JSON files. Use `open()` instead:

```js
// ✅ Correct
const environments = JSON.parse(open('../data/environments.json'));

// ❌ Wrong — not supported in k6
import environments from '../data/environments.json';
```

---

### `could not open '../report/...: no such file or directory`

Run the test from the `k6/` directory, not the project root:

```bash
# ✅ Correct
cd k6/
k6 run --env ENV=production tests/TCM-10731.js

# ❌ Wrong — file paths break
k6 run --env ENV=production k6/tests/TCM-10731.js
```

---

### `thresholds on metrics 'checks' have been crossed`

One or more checks failed and the pass rate dropped below 90%. Check the console output for which check failed:

```
✗ [CWV] LCP <= 2500ms
```

Open the generated HTML report for the exact metric values and compare against thresholds.

---

### API responded with status 404

The dashboard server does not have the `/api/reports/k6` route deployed. Either:

1. Start the local server and point to it:
   ```bash
   k6 run --env ENV=production \
     --env DASHBOARD_API=http://localhost:3001/api/reports/k6 \
     tests/TCM-10731.js
   ```

2. Deploy the updated server to `10.0.6.216` (copy `server/src/routes/k6reports.ts`, `server/src/models/K6Report.ts`, and restart).

---

### Duplicate reportId (409)

Each run generates a `reportId` based on the timestamp (e.g. `TCM-10731_2026-03-05T07-30-00`). If two runs happen within the same second, the second will get a 409. Wait a second and re-run, or delete the duplicate from the dashboard.

---

### Slow page load / timeout errors

Increase the timeout in `pages/TCM-10731.js`:

```js
const TIMEOUT = 60000;  // increase from 30s to 60s
```

Or increase `maxDuration` in the test options:

```js
maxDuration: '5m'
```
