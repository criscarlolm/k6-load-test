import { check } from 'https://jslib.k6.io/k6-utils/1.5.0/index.js';
export class CostEstimatePage {
    constructor(page) {
        this.page = page;
        this.legalFeeRadioButton = this.page.locator('input[value="1"]');
        this.paymentTypeCashRadioButton = this.page.locator("input[value='estPaymentTypeCash']");
        this.nextButton = this.page.locator("//button[@data-aut='ci_submit-btn']");
        this.verifyCostEstimate = this.page.locator('h1:nth-child(1)');
        this.continueButton = this.page.locator('a[data-aut="ci_btnSubmission"]');
        this.verifyExitPage = this.page.locator("div[class='slot svelte-1ivvp7h singleColumn'] div h2:nth-child(1)");
    }

    async completeCostEstimate() {
        await this.legalFeeRadioButton.click();
        await this.paymentTypeCashRadioButton.click();
        this.nextButton.click();
        // Wait for navigation away from cost-estimate to the matched page
        await Promise.all([
            this.page.waitForNavigation({ waitUntil: 'networkidle', timeout: 60000 })
        ]);

        // Extract case number from current URL e.g. /post-case/exit/matched/CCXXXXXX
        const currentUrl = this.page.url();
        const urlParts = currentUrl.split('/');
        const caseNumber = urlParts[urlParts.length - 1] || 'unknown';
        console.log(`Case Number: ${caseNumber}`);
        console.log(`Case URL: ${currentUrl}`);

        await this.page.screenshot({ path: 'screenshot/casePosted.png' });
        // The URL pattern /post-case/exit/matched/CCXXXXX is the real success signal
        check(currentUrl, {
            'Case should be posted!': (url) => /\/post-case\/exit\/matched\/[A-Z0-9]+/.test(url)
        });
        console.log('Cost estimate completed and Case posted!');

        // Exit page
        await this.continueButton.waitFor({ state: 'visible', timeout: 30000 });
        await this.continueButton.click();
        await this.verifyExitPage.waitFor({ state: 'visible', timeout: 30000 });
        const exitPageText = await this.verifyExitPage.textContent();
        console.log('Exit page heading text:', JSON.stringify(exitPageText));
        await check(this.verifyExitPage, {
            'Exit page': async (lo) => (await lo.textContent()) !== null
        });
        await this.page.screenshot({ path: 'screenshot/exitPage.png' });
        console.log('Exit page loaded successfully');

        return caseNumber;
    }
}
