import { check } from 'https://jslib.k6.io/k6-utils/1.5.0/index.js';

export class IssueSpecificQuestionsPage {
    constructor(page) {
        this.page = page;
        this.waitPage = page;
        this.verifyIssueSpecificQuestions = this.page.locator('#title-bar');
        this.nextButton = this.page.locator("//button[@data-aut='ci_submit-btn']");
    }

    async clickNextButton() {
        await this.nextButton.waitFor({ state: 'visible', timeout: 30000 });
        await this.nextButton.click();
        // Wait for the Description page's summary input to confirm SPA navigation
        await this.page.waitForSelector('input[type="text"][name="summary"]', { timeout: 30000 });
        await this.verifyIssueSpecificQuestions.waitFor({ state: 'visible', timeout: 30000 });
        await check(this.verifyIssueSpecificQuestions, {
            'Issue Specific Questions': async (lo) => (await lo.textContent()) === 'Description'
        });

        console.log('Issue Specific Questions');
    }
}
