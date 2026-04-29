import { randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';
import { check } from 'https://jslib.k6.io/k6-utils/1.5.0/index.js';

export class SaveCasePage {
    constructor(page) {
        this.page = page;
        this.waitPage = page;
        const textInput = randomString(8);
        this.firstNameField = this.page.locator("input[name='firstName']");
        this.firstName = `FirstName${textInput}`;
        this.lastNameField = this.page.locator("input[name='lastName']");
        this.lastName = `LastName${textInput}`;
        this.phoneField = this.page.locator('#field-phone');
        this.phoneNumner = '4354355345';
        this.emailField = this.page.locator("input[name='email']");
        this.emailAddress = 'cypressapitest@guerrillamail.com';
        this.smsCheckbox = this.page.locator('input[value="true"][name="notifyBySms"]');
        this.nextButton = this.page.locator("//button[@data-aut='ci_submit-btn']");
        this.verifySaveCase = this.page.locator('#title-bar');
    }

    async fillCaseDetails() {
        await this.firstNameField.waitFor({ state: 'visible', timeout: 30000 });
        await this.firstNameField.type(this.firstName);
        await this.lastNameField.type(this.lastName);
        await this.phoneField.type(this.phoneNumner);
        await this.emailField.type(this.emailAddress);
        await this.smsCheckbox.click();
        await this.nextButton.click();
        // Wait for the Cost Estimate page's first radio button to confirm SPA navigation
        await this.page.waitForSelector('input[value="1"]', { timeout: 30000 });
        await this.verifySaveCase.waitFor({ state: 'visible', timeout: 30000 });
        await check(this.verifySaveCase, {
            'Save Your Case': async (lo) => (await lo.textContent()) === 'Cost Estimate'
        });
        console.log('Fill in form Save Your Case');
    }
}
