import { browser } from 'k6/browser';
import { ClientLoginPage } from '../../pages/LMClient/LoginPage.js';
import { DEFAULTS } from '../../config/environment.js';
import { getOptions } from '../../config/perVUiterations.js';

export const options = getOptions();

// ========================
// Main Test Execution
// ========================
export default async function () {
    const env = __ENV.ENV || DEFAULTS.ENV;
    const page = await browser.newPage();
    const legalMatch = new ClientLoginPage(page, env);

    try {
        await legalMatch.navigateHome();
        await legalMatch.verifyHomepage();
        await legalMatch.performLoginFlow(
            __ENV.LM_USERNAME || 'crisqatest@zohomail.com',
            __ENV.LM_PASSWORD || 'testqa'
        );

        // Final verification of SSO check status
        if (!legalMatch.ssoVerified) {
            throw new Error('SSO verification failed during test execution');
        }

        await page.waitForTimeout(2000);
        console.log('Test completed successfully');
    } catch (error) {
        console.error(`Test failed: ${error.message}`);
    } finally {
        await page.close();
    }
}
