import { httpMetrics, httpCasePostingMetrics } from '../data/data.js';
import http from 'k6/http';

// Shared Chromium launch options used by every scenario below.
//
//   --no-sandbox            required when running as root (Linux CI / VMs).
//                           Harmless on Windows / non-root Linux.
//   --disable-dev-shm-usage avoids "Out of memory" crashes in containers
//                           where /dev/shm is small (e.g. Docker default 64 MB).
//
// Append more args at runtime with K6_BROWSER_EXTRA_ARGS (comma-separated):
//   K6_BROWSER_EXTRA_ARGS="--proxy-server=...,--disable-gpu"
function browserOptions() {
    const extra = (__ENV.K6_BROWSER_EXTRA_ARGS || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    return {
        type: 'chromium',
        launchOptions: {
            args: ['--no-sandbox', '--disable-dev-shm-usage', ...extra],
        },
    };
}

export function perVUiterations() {
    const vu = `${__ENV.VUS}`;
    const iteration = `${__ENV.ITER}`;
    const maxDuration = `${__ENV.DURATION}`;
    return {
        scenarios: {
            ui: {
                executor: 'per-vu-iterations',
                options: { browser: browserOptions() },
                vus: vu,
                iterations: iteration,
                maxDuration: maxDuration
            }
        },
        thresholds: {
            // the rate of successful checks should be higher than 90%
            checks: [{ threshold: 'rate == 1.00', abortOnFail: true }]
        }
    };
}

// Ramping scenario with optional load distribution across multiple machines.
//
//   Total target VUs:
//     Pass 1: ramp 0 -> PASS1 (default 15) over RAMP_UP, hold HOLD at PASS1
//     Pass 2: ramp     -> PASS2 (default 25) over RAMP_UP, hold HOLD at PASS2
//     Pass 3: ramp     -> PASS3 (default 50) over RAMP_UP, hold HOLD at PASS3
//     Ramp down to 0 over RAMP_DOWN
//
//   Distributed mode (run the same test on N machines in parallel):
//     MACHINES   total number of machines participating (default 1)
//     MACHINE_ID this machine's id, 1..MACHINES (used for tagging only)
//     The targets above are divided evenly across MACHINES, so each machine
//     runs PASSn / MACHINES VUs. Both machines must be started at roughly
//     the same time for the load profile to combine correctly.
//
//   Other env vars:
//     RAMP_UP    ramp duration per pass    (default 10m)
//     HOLD       hold duration per pass    (default 5m)
//     RAMP_DOWN  final ramp-down duration  (default 2m)
export function rampingScenario() {
    const machines = Math.max(1, parseInt(__ENV.MACHINES || '1', 10));
    const totalPass1 = parseInt(__ENV.PASS1 || '15', 10);
    const totalPass2 = parseInt(__ENV.PASS2 || '25', 10);
    const totalPass3 = parseInt(__ENV.PASS3 || '50', 10);
    const rampUp = __ENV.RAMP_UP || '10m';
    const hold = __ENV.HOLD || '5m';
    const rampDown = __ENV.RAMP_DOWN || '2m';

    // Each machine runs its share, rounded up so the combined total
    // is at least the requested target.
    const pass1 = Math.ceil(totalPass1 / machines);
    const pass2 = Math.ceil(totalPass2 / machines);
    const pass3 = Math.ceil(totalPass3 / machines);

    console.log(
        `Ramping scenario | machines=${machines} ` +
        `| this machine VU targets: Pass1=${pass1}, Pass2=${pass2}, Pass3=${pass3} ` +
        `| combined targets: ${totalPass1}/${totalPass2}/${totalPass3}`
    );

    return {
        scenarios: {
            ui: {
                executor: 'ramping-vus',
                startVUs: 0,
                stages: [
                    { duration: rampUp,   target: pass1 },
                    { duration: hold,     target: pass1 },
                    { duration: rampUp,   target: pass2 },
                    { duration: hold,     target: pass2 },
                    { duration: rampUp,   target: pass3 },
                    { duration: hold,     target: pass3 },
                    { duration: rampDown, target: 0     },
                ],
                gracefulRampDown: '30s',
                options: { browser: browserOptions() }
            }
        },
        thresholds: {
            // Don't abort on a single failure during a long load test
            checks: [{ threshold: 'rate >= 0.90' }]
        }
    };
}

// Single-pass ramping scenario: ramp 0 -> TARGET over RAMP_UP, hold HOLD, ramp down.
//
// Useful for isolating a specific load level (e.g. "just Pass 2 = 25 VUs") so
// failures aren't mixed in with prior passes.
//
//   TARGET     target VUs for this pass     (default 15)
//   RAMP_UP    ramp duration                (default 10m)
//   HOLD       hold duration at TARGET      (default 5m)
//   RAMP_DOWN  final ramp-down duration     (default 2m)
//
// Distributed mode (same as rampingScenario): TARGET is divided across MACHINES.
export function singlePassRamping() {
    const machines = Math.max(1, parseInt(__ENV.MACHINES || '1', 10));
    const totalTarget = parseInt(__ENV.TARGET || '15', 10);
    const rampUp = __ENV.RAMP_UP || '10m';
    const hold = __ENV.HOLD || '5m';
    const rampDown = __ENV.RAMP_DOWN || '2m';

    const target = Math.ceil(totalTarget / machines);

    console.log(
        `Single-pass ramping | machines=${machines} ` +
        `| this machine VU target=${target} | combined target=${totalTarget} ` +
        `| ramp=${rampUp} hold=${hold} rampDown=${rampDown}`
    );

    return {
        scenarios: {
            ui: {
                executor: 'ramping-vus',
                startVUs: 0,
                stages: [
                    { duration: rampUp,   target: target },
                    { duration: hold,     target: target },
                    { duration: rampDown, target: 0      },
                ],
                gracefulRampDown: '30s',
                options: { browser: browserOptions() }
            }
        },
        thresholds: {
            // Don't abort on a single failure during a load test
            checks: [{ threshold: 'rate >= 0.90' }]
        }
    };
}

export function httpMetricsData() {
    const {
        casePostEnv,
        casePostRest,
        casePostExitTest,
        homeAttorneyLogin,
        responseCase,
        enagageCase,
        completeCase
    } = httpMetrics;
    http.get(casePostEnv);
    http.options(casePostRest);
    http.get(casePostExitTest);
    http.get(homeAttorneyLogin);
    http.post(responseCase);
    http.post(enagageCase);
    http.post(completeCase);
}

export function httpMetricsCasePostingData() {
    const { casePostEnv, casePostRest, casePostExitTest } = httpCasePostingMetrics;
    http.get(casePostEnv);
    http.options(casePostRest);
    http.get(casePostExitTest);
}
