import { browser } from 'k6/experimental/browser';
import { describe } from 'https://jslib.k6.io/k6chaijs/4.3.4.3/index.js';
import http from 'k6/http';
import { check } from 'k6';
import { SearchAttorneyPage } from '../../pages/SearchAttorneyPage.js';
import { SubCategoryPage } from '../../pages/SubCategoryPage.js';
import { IssueSpecificQuestionsPage } from '../../pages/IssueSpecificQuestions.js';
import { DescriptionPage } from '../../pages/Description.js';
import { SaveYourCasePage } from '../../pages/SaveYourCase.js';
import { CostEstimatePage } from '../../pages/CostEstimate.js';
import { MatchedCasePage } from '../../pages/MatchedCase.js';
import { LoginAttorneyPage } from '../../pages/Attorney/AttorneyLoginPage.js';
import { AttorneySearchPage } from '../../pages/Attorney/AttorneySearchCase.js';
import { CaseStatusPage } from '../../pages/Attorney/CaseStatus.js';
import { perVUiterations, httpMetricsCasePostingData } from '../../common/scenarios.js';
import { checkVerification } from '../../utils/objectLocators.js';

export let options = perVUiterations();

export default async function () {
    const page = browser.newPage();
    const {
        homePageCheck,
        homePageText,
        subCategoryCheck,
        subCategoryText,
        issueSpecificQuestionsCheck,
        issueSpecificQuestionsText,
        descriptionCheck,
        descriptionText,
        saveYourCaseCheck,
        saveYourCaseText,
        costEstimateCheck,
        costEstimateText,
        matchPageCheck,
        matchedCaseText,
        attorneyLogInPage,
        attorneyLogInPageCheck,
        attorneyDashboardPage,
        attorneyDashboardPageCheck,
        caseRecordTitle,
        caseRecordTitleCheck,
        openTabPage,
        openTabPageCheck,
        responseMessage,
        responseMessageCheck,
        responseTabPage,
        responseTabPageCheck,
        caseEngageMessage,
        caseEngageMessageCheck,
        caseEnagageTabPage,
        caseEnagageTabPageCheck,
        caseCompletedMessage,
        caseCompletedMessageCheck,
        caseRecordStatus,
        caseRecordStatusCheck
    } = checkVerification;
    const searchAttorney = new SearchAttorneyPage(page);
    const subCategory = new SubCategoryPage(page);
    const issueSpecificQuestions = new IssueSpecificQuestionsPage(page);
    const descriptions = new DescriptionPage(page);
    const saveYourCase = new SaveYourCasePage(page);
    const costEstimate = new CostEstimatePage(page);
    const matchedCase = new MatchedCasePage(page);
    const logInAttorney = new LoginAttorneyPage(page);
    const attorneySearch = new AttorneySearchPage(page);
    const caseStatus = new CaseStatusPage(page);
    const url = `https://${__ENV.DOMAIN}`;

    describe('[TCM-6551] TCM-1: [Load Testing - Browser] - Case Posting Module -> Response-Engage-Complete Case', async () => {
        // Search Attorney
        await searchAttorney.goto();
        check(page, {
            'Home Page': () => page.locator(homePageCheck).textContent() == homePageText
        });
        await searchAttorney.searchAttorney();

        // Select Sub Category
        check(page, {
            'Select Sub Category Page': () =>
                page.locator(subCategoryCheck).textContent() == subCategoryText
        });
        await subCategory.subCategoryPage();

        // Issue Specific Question
        check(page, {
            'Issue Specific Question Page': () =>
                page.locator(issueSpecificQuestionsCheck).textContent() ==
                issueSpecificQuestionsText
        });
        await issueSpecificQuestions.issueSpecificQuestionPage();

        // Description
        check(page, {
            'Description Page': () =>
                page.locator(descriptionCheck).textContent() == descriptionText
        });
        await descriptions.descriptionPage();

        // Save Your Case
        check(page, {
            'Save Your Case Page': () =>
                page.locator(saveYourCaseCheck).textContent() == saveYourCaseText
        });
        await saveYourCase.saveYourCasePage();

        // Cost Estimate
        check(page, {
            'Cost Estimate Page': () =>
                page.locator(costEstimateCheck).textContent() == costEstimateText
        });

        await costEstimate.costEstimatePage();

        // Matched Case
        check(page, {
            'Case Matched and Posted': () =>
                page.locator(matchPageCheck).innerText() == matchedCaseText
        });

        await matchedCase.caseMatchedMessageCheck();

        // LogIn Attorney
        await logInAttorney.goto();
        await logInAttorney.clickLogInLink();
        check(page, {
            'User Should Successfully Login as Attorney': () =>
                page.locator(attorneyLogInPage).textContent() == attorneyLogInPageCheck
        });

        await logInAttorney.logInForm();
        check(page, {
            'Should be landed at Attorney Dashboard Page': () =>
                page.locator(attorneyDashboardPage).textContent() == attorneyDashboardPageCheck
        });

        // Search Case Record
        await attorneySearch.verifySearchCase();
        check(page, {
            'Case Record Should be Found': () =>
                page.locator(caseRecordTitle).innerText() == caseRecordTitleCheck
        });
        await attorneySearch.clickCaseRecord();

        // Reply Message
        await caseStatus.clickReplyButton();
        await caseStatus.enterMessage();
        await caseStatus.consulatationFields();
        await caseStatus.clickSendReplyButton();
        check(page, {
            'Successfully Responded the Case Record': () =>
                page.locator(responseMessage).innerText() == responseMessageCheck
        });

        await caseStatus.verifyRespondedTab();
        check(page, {
            'Verify Responded tab page': () =>
                page.locator(responseTabPage).innerText() == responseTabPageCheck
        });

        // Engage Case Record
        await caseStatus.clickEngageButton();
        check(page, {
            'Successfully Engage the Case Record': () =>
                page.locator(caseEngageMessage).innerText() == caseEngageMessageCheck
        });
        await caseStatus.clickEngageTab();
        check(page, {
            'Should be at the Engage Tab Page': () =>
                page.locator(caseEnagageTabPage).innerText() == caseEnagageTabPageCheck
        });
        // Complete Case Record
        await caseStatus.selectCaseRecord();
        await caseStatus.completeButtonClick();
        check(page, {
            'Case Record Successfully Completed': () =>
                page.locator(caseCompletedMessage).innerText() == caseCompletedMessageCheck
        });

        // Verify Case Status Completed
        await attorneySearch.verifySearchCase();
        check(page, {
            'Verify Case Record Status Completed': () =>
                page.locator(caseRecordStatus).innerText() == caseRecordStatusCheck
        });

        page.close();
    });

    let res = http.get(url);
    http.get(res.url);
    httpMetricsCasePostingData();
}
