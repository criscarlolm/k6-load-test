import { check } from 'https://jslib.k6.io/k6-utils/1.5.0/index.js';
import { getSsoUrl, isValidSsoUrl } from '../../data/data.js';
import http from 'k6/http';

const url = `https://${__ENV.DOMAIN}`;

export class HomePage {
    constructor(page, environment) {
        this.page = page;
        this.waitNav = page;
        this.waitPage = page;
        this.homePageCheck = this.page.locator('.case-intake-form__sub-header');
        this.loginLinkLocator = this.page.locator(
            '.header__nav-item.top-menu__item.header__nav-item'
        );
        this.environment = environment;
    }

    async visit() {
        let res = http.get(url);
        await this.page.goto(res.url);
        await this.page.screenshot({ path: 'screenshot/attorneyHomePage.png' });
    }

    async homePageCheckVerification() {
        await check(this.homePageCheck, {
            'Home page': async (lo) => (await lo.textContent()) === ' for Your Legal Issue'
        });

        console.log('Page loaded successfully');
    }

    async clickLogin() {
        try {
            await this.loginLinkLocator.waitFor();
            console.log('Login text field found');
            await this.loginLinkLocator.click();
            await this.waitPage.waitForTimeout(5000);

             const currentUrl = await this.page.url();
             if (!isValidSsoUrl(currentUrl, this.environment)) {
                 throw new Error(
                     `Invalid SSO URL. Expected URL to start with ${getSsoUrl(
                         this.environment
                     )}, ` + `but got ${currentUrl}`
                 );
             }

             console.log(`Successfully redirected to SSO login page for ${this.environment}`);

        } catch (error) {
            console.error('Failed during login process:', error);
            throw error;
        }

    }
}
