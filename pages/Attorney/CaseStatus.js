import {
    responseMessagePageLocators,
    EngageCompleteCaseLocators,
    attorneySearchPageLocators
} from '../../utils/objectLocators.js';

import { descriptionText } from '../../data/data.js';

export class CaseStatusPage {
    constructor(page) {
        const { summary } = descriptionText;
        const {
            respondedTab,
            replyButton,
            selectTemplateDropdown,
            selectOption,
            subjectMessage,
            messageBody,
            sendReplyButton,
            consultationFee,
            consultationAppointment
        } = responseMessagePageLocators;
        const {
            engageButton,
            engageTab,
            caseEngageRecord,
            caseEngageMessage,
            completeCaseButton,
            caseRecordToComplete,
            caseCompleteMessage,
            clickCompleteButton
        } = EngageCompleteCaseLocators;
        const { seachInput, searchBtn, caseTitle } = attorneySearchPageLocators;
        this.page = page;
        this.waitPage = page;
        this.reload = page;
        this.respondedTab = page.locator(respondedTab);
        this.replyButton = page.locator(replyButton);
        this.templateDropdown = page.locator(selectTemplateDropdown);
        this.optionValue = page.locator(selectOption);
        this.subjectMessage = page.locator(subjectMessage);
        this.messageBody = page.locator(messageBody);
        this.consultationFee = page.locator(consultationFee);
        this.consultationAppointment = page.locator(consultationAppointment);
        this.sendReplyButton = page.locator(sendReplyButton);
        this.seachInput = page.locator(seachInput);
        this.searchBtn = page.locator(searchBtn);
        this.caseTitle = page.locator(caseTitle);
        this.engageButton = page.locator(engageButton);
        this.engageTab = page.locator(engageTab);
        this.caseEngageRecord = page.locator(caseEngageRecord);
        this.caseEgageRecordList = page.locator(`${caseEngageRecord}'${summary}']`);
        this.caseEngageMessage = page.locator(caseEngageMessage);
        this.completeCaseButton = page.locator(completeCaseButton);
        this.caseRecordToComplete = page.locator(`${caseRecordToComplete}'${summary}']`);
        this.caseCompleteMessage = page.locator(caseCompleteMessage);
        this.clickCompleteButton = page.locator(clickCompleteButton);
    }

    async clickReplyButton() {
        this.replyButton.click();
        this.waitPage.waitForTimeout(10000);
    }

    async enterMessage() {
        const { summary } = descriptionText;
        this.subjectMessage.type(summary);
        this.messageBody.type(summary);
    }

    async consulatationFields() {
        const { consultationValue } = responseMessagePageLocators;
        this.consultationFee.fill(consultationValue);
        this.consultationAppointment.click();
    }

    async clickSendReplyButton() {
        this.waitPage.waitForTimeout(10000);
        this.sendReplyButton.click();
        this.page.screenshot({ path: 'screenshot/caseResponded.png' });
        this.waitPage.waitForTimeout(10000);
    }

    async verifyRespondedTab() {
        this.reload.reload();
    }

    async clickEngageButton() {
        this.engageButton.click();
        this.page.screenshot({ path: 'screenshot/caseEngaged.png' });
        this.waitPage.waitForTimeout(5000);
    }

    async clickEngageTab() {
        this.engageTab.click();
        this.waitPage.waitForTimeout(5000);
    }

    async selectCaseRecord() {
        this.caseRecordToComplete.click();
        this.waitPage.waitForTimeout(5000);
    }

    async completeButtonClick() {
        this.clickCompleteButton.click();
        this.page.screenshot({ path: 'screenshot/caseCompleted.png' });
        this.waitPage.waitForTimeout(5000);
    }
}
