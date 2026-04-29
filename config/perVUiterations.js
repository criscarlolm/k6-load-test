import { DEFAULTS } from '../config/environment.js';
// ========================
// Test Configuration
// ========================
export function getOptions() {
    return {
        scenarios: {
            browser_test: {
                executor: 'per-vu-iterations',
                options: {
                    browser: {
                        type: 'chromium',
                        launchOptions: {
                            headless: true,
                            args: ['--no-sandbox', '--disable-gpu', '--disable-service-worker']
                        }
                    }
                },
                vus: parseInt(__ENV.VUS) || DEFAULTS.VUS,
                iterations: parseInt(__ENV.ITERATIONS) || DEFAULTS.ITERATIONS,
                maxDuration: '3m'
            }
        },
        thresholds: {
            checks: ['rate>0.9'],
            sso_redirect_failure_rate: ['rate==0'],
            login_failure_rate: ['rate==0']
        }
    };
}
