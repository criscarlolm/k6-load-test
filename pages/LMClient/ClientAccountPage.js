import { check } from 'https://jslib.k6.io/k6-utils/1.5.0/index.js';

export class ClientAccountPage {
    constructor(page) {
        this.page = page;
        this.myAccountTextLocator = this.page.locator('div[class="cui-label cui-g-medium"]');
    }

    async verifyAccountPage() {
        const accountPageCheck = await check(this.myAccountTextLocator, {
            ClientAccountPage: async (loc) => (await loc.textContent()) === 'My Account'
        });

        if (!accountPageCheck) {
            throw new Error('Account page verification failed.');
        }

        console.log('Navigation after login completed');
    }

    async verifyMyAccountText() {
        await this.myAccountTextLocator.waitFor();
        console.log('My Account text found');

        await Promise.all([
            this.page.waitForNavigation({ waitUntil: 'networkidle', timeout: 5000 }),
            this.myAccountTextLocator.isVisible()
        ]);
    }
}
