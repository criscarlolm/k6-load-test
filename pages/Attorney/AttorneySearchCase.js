import { attorneySearchPageLocators, openTabPageLocators } from '../../utils/objectLocators.js';
import { descriptionText } from '../../data/data.js';
export class AttorneySearchPage {
    constructor(page) {
        const { seachInput, searchBtn, caseTitle } = attorneySearchPageLocators;
        const { openTab } = openTabPageLocators;
        this.page = page;
        this.reload = page;
        this.waitPage = page;
        this.seachInput = page.locator(seachInput);
        this.searchBtn = page.locator(searchBtn);
        this.caseTitle = page.locator(caseTitle);
        this.openTab = page.locator(openTab);

        this.waitNav = page;
    }
    async verifySearchCase() {
        const { summary } = descriptionText;
        this.seachInput.clear();
        this.seachInput.type(summary);
        const searchButton = await this.searchBtn;
        await Promise.all([this.waitNav.waitForNavigation(60), searchButton.click()]);
        this.waitPage.waitForTimeout(10000);
    }

    async clickCaseRecord() {
        const caseRecord = await this.caseTitle;
        await Promise.all([this.waitNav.waitForNavigation(60), caseRecord.click()]);
        this.page.screenshot({ path: 'screenshot/openTabPage.png' });
        this.waitPage.waitForTimeout(10000);
    }
}
