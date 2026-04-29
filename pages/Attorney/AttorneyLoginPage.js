import { check } from 'https://jslib.k6.io/k6-utils/1.5.0/index.js';
import { sleep } from 'k6';
import http from 'k6/http';
import { data } from '../../data/data.js';

const url = `https://${__ENV.DOMAIN}`;

export class LoginAttorneyPage {
    constructor(page) {
        this.page = page;
        this.waitPage = page;
        this.waitNav = page;
        this.verifyHomePage = this.page.locator(
            "h1[class='case-intake-form__header'] a[class='case-intake-form__header--link']"
        );
        this.homePageText = 'Find the Right Lawyer for Your Legal Issue!';
        this.loginLink = this.page.locator('.header__nav-item.top-menu__item.header__nav-item');
        this.verifyLoginPage = this.page.locator("//label[normalize-space()='Email/Username:']");
        this.veriLoginText = 'Email/Username:';
        this.logInAfterCasePost = this.page.locator("//a[normalize-space()='Log In']");
        this.userField = this.page.locator("//input[@id='userName']");
        this.passField = this.page.locator("//input[@id='password']");
        this.logInButton = this.page.locator("input[value='Log In']");
        this.caseTitleText = this.page.locator("//th[@class='caseTitle']//a[@href='#']");
        this.seachInput = this.page.locator("//input[@id='searchQuery']");
        this.searchBtn = this.page.locator('#searchSubmit');
    }

    async visit() {
        let res = http.get(url);
        await this.page.goto(res.url);
        await check(this.verifyHomePage, {
            'Home Page': async (lo) =>
                (await lo.textContent()) === 'Find the Right Lawyer for Your Legal Issue!'
        });
        console.log('Page loaded successfully');
    }

    async clickLogInLink() {
        await this.loginLink.click();
        await check(this.verifyLoginPage, {
            'Login Page': async (lo) => (await lo.textContent()) === 'Email/Username:'
        });
        console.log('Navigated to Login page successfully');
        await this.page.screenshot({ path: 'screenshot/attorneyLoginPage.png' });
    }

    async logInForm() {
        const { username, password } = data;
        sleep(3);
        this.userField.fill(username);
        this.passField.fill(password);
        sleep(3);
        await this.logInButton.click();
        await Promise.all([
            this.waitNav.waitForNavigation({ waitUntil: 'networkidle', timeout: 20000 })
        ]);
        await check(this.caseTitleText, {
            'Attorney Dashboard': async (lo) => (await lo.textContent()) === 'Case Title ▼'
        });
        console.log('Navigated to Attorney Dashboard page successfully');
        this.waitPage.waitForTimeout(15000);
    }
}
