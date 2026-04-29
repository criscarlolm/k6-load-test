import { browser } from 'k6/browser';
import { AttorneyLoginPage } from '../../pages/Attorney/LoginPage.js';
import { DEFAULTS } from '../../config/environment.js';
import { getOptions } from '../../config/perVUiterations.js';

export const options = getOptions();

// ========================
// Main Test Execution
// ========================
export default async function () {
    const env = __ENV.ENV || DEFAULTS.ENV;
    const page = await browser.newPage();
    const legalMatchAttorney = new AttorneyLoginPage(page, env);

    try {
        await legalMatchAttorney.navigateHome();
        await legalMatchAttorney.verifyHomepage();
        await legalMatchAttorney.performLoginFlow(
            __ENV.LM_USERNAME || 'test_attorney_naruto',
            __ENV.LM_PASSWORD || 'attorney'
        );

        // Final verification of SSO check status
        if (!legalMatchAttorney.ssoVerified) {
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
