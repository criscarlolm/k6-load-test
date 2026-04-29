import { check } from 'https://jslib.k6.io/k6-utils/1.5.0/index.js';
import { metrics } from '../../utils/metrics.js';
import { DEFAULTS, ENV_CONFIG } from '../../config/environment.js';

export class AttorneyLoginPage {
    constructor(page, environment) {
        this.page = page;
        this.config = ENV_CONFIG[environment];
        this.ssoVerified = false;
    }

    async navigateHome() {
        await this.page.goto(this.config.baseUrl, {
            waitUntil: 'networkidle',
            timeout: DEFAULTS.TIMEOUT
        });
    }

    async verifyHomepage() {
        try {
            const heading = await this.page.waitForSelector(this.config.selectors.mainHeading, {
                timeout: DEFAULTS.TIMEOUT
            });
            return check(await heading.textContent(), {
                'Homepage loaded': (t) => t.includes('Find the Right Lawyer for Your Legal Issue!')
            });
        } catch (error) {
            await this._handleError('Homepage verification', error);
        }
    }

    async performLoginFlow(username, password) {
        try {
            await this._attemptSSOLogin();
            await this._submitCredentials(username, password);
            return this._verifyDashboard();
        } catch (error) {
            await this._handleError('Login process', error, DEFAULTS.SCREENSHOTS.LOGIN);
        }
    }

    async _attemptSSOLogin() {
        try {
            const loginLink = await this.page.waitForSelector(this.config.selectors.loginLink, {
                timeout: DEFAULTS.TIMEOUT
            });
            await loginLink.click();

            await this.page.waitForNavigation({
                waitUntil: 'networkidle',
                timeout: DEFAULTS.TIMEOUT
            });

            const currentUrl = this.page.url();
            this.ssoVerified = currentUrl.startsWith(this.config.ssoUrl);

            if (!this.ssoVerified) {
                metrics.ssoRedirectFailure.add(1);
                await this.page.screenshot({ path: DEFAULTS.SCREENSHOTS.SSO_REDIRECT });
                console.warn('SSO verification failed - continuing with login attempt');
            }
        } catch (error) {
            metrics.ssoRedirectFailure.add(1);
            await this.page.screenshot({ path: DEFAULTS.SCREENSHOTS.SSO_REDIRECT });
            console.warn('SSO navigation failed - continuing with login attempt');
        }
    }

    async _submitCredentials(username, password) {
        await this.page.fill(this.config.selectors.usernameInput, username);
        await this.page.fill(this.config.selectors.passwordInput, password);
        await this.page.click(this.config.selectors.loginButton);
        await this.page.waitForNavigation({ timeout: DEFAULTS.TIMEOUT });
    }

    async _verifyDashboard() {
        try {
            const header = await this.page.waitForSelector(
                this.config.selectors.dashboardAttorney,
                {
                    timeout: DEFAULTS.TIMEOUT
                }
            );
            return check(await header.textContent(), {
                'Attorney Login Successfully': (t) => t.includes('New')
            });
        } catch (error) {
            throw new Error('Dashboard verification failed');
        }
    }

    async _handleError(context, error, screenshotPath) {
        console.error(`${context} failed: ${error.message}`);
        metrics.loginFailure.add(1);
        await this.page.screenshot({ path: screenshotPath });
    }
}
