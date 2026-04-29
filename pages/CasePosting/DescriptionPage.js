import { randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';
import { check } from 'https://jslib.k6.io/k6-utils/1.5.0/index.js';

export class DescriptionPage {
    constructor(page) {
        this.page = page;
        this.waitPage = page;
        this.summaryField = this.page.locator('input[type="text"][name="summary"]');
        const textInput = randomString(8);
        // __ITER is 0-based, +1 makes it human-readable (Case #1, #2, #3...)
        const caseCount = __ITER + 1;
        this.summaryFieldText = `Load Browser Test Summary #${caseCount} ${textInput}`;
        this.descriptionField = this.page.locator('textarea[id="fieldDescription"][name="description"]');
        this.descriptionFieldText = `Load Browser Test Description #${caseCount} ${textInput}`;
        this.verifyDescription = this.page.locator('#title-bar');
        this.nextButton = this.page.locator("//button[@data-aut='ci_submit-btn']");
    }

    async fillDescription() {
        await this.summaryField.waitFor({ state: 'visible', timeout: 30000 });
        await this.summaryField.type(this.summaryFieldText);
        await this.descriptionField.waitFor({ state: 'visible', timeout: 30000 });
        await this.descriptionField.type(this.descriptionFieldText);
        await this.nextButton.click();
        // Wait for Save Your Case page's firstName field to confirm SPA navigation completed
        await this.page.waitForSelector("input[name='firstName']", { timeout: 30000 });
        await this.verifyDescription.waitFor({ state: 'visible', timeout: 30000 });
        await check(this.verifyDescription, {
            'Description': async (lo) =>
                (await lo.textContent()) === 'Save Your Case'
        });

        console.log('Fill in Description');
    }
}
