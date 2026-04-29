import { check } from 'https://jslib.k6.io/k6-utils/1.5.0/index.js';

import http from 'k6/http';

const url = `https://${__ENV.DOMAIN}`;

export class SearchAttorneyPage {
    constructor(page) {
        this.page = page;
        this.waitNav = page;
        this.waitPage = page;
        this.homePageCheck = this.page.locator('.case-intake-form__sub-header');
        this.category = this.page.locator("//button[normalize-space()='Choose a Category']");
        const categoryToSelect = 'Family';
        this.categoryItem = this.page.locator(
            `//div[@class='case-intake-form__dropdown-menu dropdown-menu js-case-intake-categories-dropdown is-single-choice']//div[normalize-space()='${categoryToSelect}']`
        );
        this.zipCode = this.page.locator("//input[@placeholder='Enter ZIP Code or City']");
        this.zipCode00001 = '00001';
        this.locationCheckerValid = '.case-intake-form__location-checker--valid';
        this.submitBtn = this.page.locator("//button[@data-aut='ci_submit-btn']");
        this.checkSearchAttorney = this.page.locator('#subcategory-title-bar');
    }

    async visit() {
        let res = http.get(url);
        await this.page.goto(res.url);
        await this.page.screenshot({ path: 'screenshot/attorneyHomePage.png' });
    }

    async homePageCheckVerification() {
        await check(this.homePageCheck, {
            'Home page': async (lo) => (await lo.textContent()) === ' Start Here First'
        });

        console.log('Page loaded successfully');
    }

    async searchForAttorney() {
        await this.category.click();
        await this.categoryItem.click();
        await this.zipCode.waitFor({ state: 'visible', timeout: 30000 });
        await this.zipCode.fill(this.zipCode00001);
        await this.page.waitForSelector(this.locationCheckerValid);
        await this.submitBtn.click();
        await Promise.all([
            this.page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 })
        ]);
        await this.checkSearchAttorney.waitFor({ state: 'visible', timeout: 60000 });
        await check(this.checkSearchAttorney, {
            'Search Attorney': async (lo) => (await lo.textContent()) === 'Choose a Subcategory:'
        });

        console.log('Search Attorney successfully');
        await this.waitPage.waitForTimeout(1000);
    }
}
