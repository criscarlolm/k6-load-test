import { check } from 'k6';

const environments = JSON.parse(open('../data/environments.json'));
const TIMEOUT = 30000;

export class LawyersLegalLawsHomePage {
    constructor(page, environment = 'production') {
        this.page = page;
        this.config = environments[environment];

        if (!this.config) {
            throw new Error(`Unknown environment: "${environment}". Valid options: ${Object.keys(environments).join(', ')}`);
        }
    }

    // ========================
    // Navigation
    // ========================
    async navigateHome() {
        await this.page.goto(this.config.baseUrl, {
            waitUntil: 'networkidle',
            timeout: TIMEOUT
        });
    }

    // ========================
    // Element Verification
    // ========================
    async verifyHomePage() {
        const logo = await this.page.waitForSelector(
            this.config.selectors.mainHeadingLogo,
            { timeout: TIMEOUT }
        );

        const isVisible = await logo.isVisible();

        check(isVisible, {
            'Home page logo is visible': (v) => v === true
        });

        return isVisible;
    }

    // ========================
    // Web Vitals
    // ========================
    async collectWebVitals() {
        const webVitals = await this.page.evaluate(() => {
            return new Promise((resolve) => {
                const vitals = {};

                // LCP, CLS, INP via PerformanceObserver
                const observer = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (entry.entryType === 'largest-contentful-paint') {
                            vitals.lcp = entry.startTime;
                        }
                        if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
                            vitals.cls = (vitals.cls || 0) + entry.value;
                        }
                        // INP: track worst interaction duration
                        if (entry.entryType === 'event') {
                            const duration = entry.processingEnd - entry.startTime;
                            if (!vitals.inp || duration > vitals.inp) {
                                vitals.inp = duration;
                            }
                        }
                    }
                });

                try {
                    observer.observe({ type: 'largest-contentful-paint', buffered: true });
                    observer.observe({ type: 'layout-shift', buffered: true });
                    observer.observe({ type: 'event', buffered: true, durationThreshold: 16 });
                } catch (_) {}

                // Navigation timing: TTFB, TBT proxy, FCP, load times
                const navEntry = performance.getEntriesByType('navigation')[0];
                if (navEntry) {
                    vitals.ttfb             = navEntry.responseStart - navEntry.requestStart;
                    vitals.domContentLoaded = navEntry.domContentLoadedEventEnd - navEntry.startTime;
                    vitals.loadTime         = navEntry.loadEventEnd - navEntry.startTime;

                    // TBT: sum of long task durations beyond 50ms blocking threshold
                    vitals.tbt = 0;
                }

                // TBT via long tasks
                try {
                    const ltObserver = new PerformanceObserver((list) => {
                        for (const entry of list.getEntries()) {
                            vitals.tbt = (vitals.tbt || 0) + Math.max(0, entry.duration - 50);
                        }
                    });
                    ltObserver.observe({ type: 'longtask', buffered: true });
                } catch (_) {}

                const paintEntries = performance.getEntriesByType('paint');
                for (const entry of paintEntries) {
                    if (entry.name === 'first-contentful-paint') vitals.fcp = entry.startTime;
                    if (entry.name === 'first-paint')            vitals.fp  = entry.startTime;
                }

                setTimeout(() => resolve(vitals), 1500);
            });
        });

        // Core Web Vitals checks (Success Metrics)
        check(webVitals, {
            '[CWV] LCP <= 2500ms':  (v) => v.lcp  == null || v.lcp  <= 2500,
            '[CWV] INP <= 200ms':   (v) => v.inp  == null || v.inp  <= 200,
            '[CWV] CLS <= 0.1':     (v) => v.cls  == null || v.cls  <= 0.1,
        });

        // Interim Metric checks
        check(webVitals, {
            '[Interim] LCP <= 2000ms': (v) => v.lcp == null || v.lcp  <= 2000,
            '[Interim] TBT <= 200ms':  (v) => v.tbt == null || v.tbt  <= 200,
            '[Interim] CLS <= 0.1':    (v) => v.cls == null || v.cls  <= 0.1,
        });

        // Supporting metrics checks
        check(webVitals, {
            'TTFB <= 800ms':               (v) => v.ttfb    == null || v.ttfb    <= 800,
            'FCP <= 2500ms':               (v) => v.fcp     == null || v.fcp     <= 2500,
            'Page Load Time <= 5000ms':    (v) => v.loadTime == null || v.loadTime <= 5000,
        });

        console.log(
            `[Web Vitals] ` +
            `TTFB: ${webVitals.ttfb?.toFixed(0)}ms | ` +
            `FCP: ${webVitals.fcp?.toFixed(0)}ms | ` +
            `LCP: ${webVitals.lcp?.toFixed(0)}ms | ` +
            `INP: ${webVitals.inp != null ? webVitals.inp.toFixed(0) + 'ms' : 'N/A'} | ` +
            `TBT: ${webVitals.tbt?.toFixed(0)}ms | ` +
            `CLS: ${webVitals.cls?.toFixed(4)} | ` +
            `Load: ${webVitals.loadTime?.toFixed(0)}ms`
        );

        return webVitals;
    }
}
