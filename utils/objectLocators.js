import { descriptionText } from '../data/data.js';
const { summary } = descriptionText;

export const checkVerification = {
    homePageCheck: "h1[class='case-intake-form__header'] a[class='case-intake-form__header--link']",
    homePageText: 'Find the Right Lawyer for Your Legal Issue!',
    subCategoryCheck: "//h1[@id='subcategory-title-bar']",
    subCategoryText: 'Choose a Subcategory:',
    issueSpecificQuestionsCheck: "(//h1[normalize-space()='Issue-Specific Questions'])[1]",
    issueSpecificQuestionsText: 'Issue-Specific Questions',
    descriptionCheck: "(//h1[normalize-space()='Description'])[1]",
    descriptionText: 'Description',
    saveYourCaseCheck: "(//h1[normalize-space()='Save Your Case'])[1]",
    saveYourCaseText: 'Save Your Case',
    costEstimateCheck: "(//h1[normalize-space()='Cost Estimate'])[1]",
    costEstimateText: 'Cost Estimate',
    matchedCaseCheck1: '(//h1[normalize-space()="',
    matchedCaseCheck2: "Congratulations, You've Been Matched!",
    matchedCaseCheck3: '"])[1]',
    matchPageCheck: `(//h1[normalize-space()="Congratulations, You've Been Matched!"])[1]`,
    matchedCaseText: "Congratulations, You've Been Matched!",
    attorneyLogInPage: "//label[normalize-space()='Email/Username:']",
    attorneyLoginPageText: 'Email/Username:',
    caseTitle: "//th[@class='caseTitle']//a[@href='#']",
    caseTitleText: 'Case Title ▼',
    attorneyLogInPage: "//label[normalize-space()='Email/Username:']",
    attorneyLogInPageCheck: 'Email/Username:',
    attorneyDashboardPage: "//span[@class='aae-top-header__search-label']",
    attorneyDashboardPageCheck: 'Search',
    caseRecordTitle: `//b[normalize-space()='${summary}']`,
    caseRecordTitleCheck: `${summary}`,
    openTabPage: `(//span[@class='open'])[1]`,
    opeTabPageCheck: 'Open',
    responseMessage: "//h2[normalize-space()='Response Sent']",
    responseMessageCheck: 'Response Sent',
    responseTabPage:
        "(//span[@class='cl aae-nav__case-label aae-v2__nav-link-label'][normalize-space()='Responded'])[2]",
    responseTabPageCheck: 'Responded',
    caseEngageMessage: "//div[@id='declinePrompt']",
    caseEngageMessageCheck: 'x\nCase Engaged.',
    caseEnagageTabPage:
        "(//span[@class='cl aae-nav__case-label aae-v2__nav-link-label'][normalize-space()='Engaged'])[2]",
    caseEnagageTabPageCheck: 'Engaged',
    caseCompletedMessage: "//div[@id='content']//p[1]",
    caseCompletedMessageCheck: 'Case Completed. Undo',
    caseRecordStatus: "//td[@class='status']",
    caseRecordStatusCheck: 'Completed'
};

export const searchAttorneyLocators = {
    homePage: "//h1[@class='case-intake-form__header']//a[@class='case-intake-form__header--link']",
    homePageCheck: "h1[class='case-intake-form__header'] a[class='case-intake-form__header--link']",
    homePageText: 'Find the Right Lawyer for Your Legal Issue!',
    verificationHomePageText:
        "//h1[@class='case-intake-form__header']//a[@class='case-intake-form__header--link']",
    chooseCategory: "//button[normalize-space()='Choose a Category']",
    categoryToSelect: 'Family',
    categoriesDropdown:
        "//div[@class='case-intake-form__dropdown-menu dropdown-menu js-case-intake-categories-dropdown is-single-choice']//div[normalize-space()=",
    zipCode: "//input[@placeholder='ZIP Code or Location']",
    locationCheckerValid: '.case-intake-form__location-checker--valid',
    submitBtn: "//button[@data-aut='ci_submit-btn']"
};

export const subCategoryLocators = {
    chooseSubCategory: "//h1[normalize-space()='Choose a Subcategory:']",
    subCategoryVal: 'Adoptions',
    subCategoryCheckBox: '//label[normalize-space()=',
    nextBtn: "//button[@data-aut='ci_submit-btn']"
};

export const saveYourCaseLocators = {
    saveYourCase: "//h1[normalize-space()='Save Your Case']",
    firstName: "input[name='firstName']",
    lastName: "input[name='lastName']",
    telNumber: '#field-phone',
    emailAddress: "input[name='email']",
    textMessageCheckbox: "input[value='true'][name='notifyBySms']",
    nextBtn: "//button[@data-aut='ci_submit-btn']"
};

export const issueSpecificQuestionsLocators = {
    issueSpecificQuestions: "//h1[normalize-space()='Issue-Specific Questions']",
    nextBtn: "//button[@data-aut='ci_submit-btn']"
};

export const descriptionPageLocators = {
    description: "//h1[normalize-space()='Description']",
    stateAttorney: "input[placeholder='State why you need an attorney.']",
    stateHighlights:
        "//textarea[@placeholder='State the highlights / major facts that support your claim.']",
    nextBtn: "//button[@data-aut='ci_submit-btn']"
};

export const costEstimatePageLocators = {
    costEstimate: "//h1[normalize-space()='Cost Estimate']",
    levelExperienceRadioButton: "input[value='1']",
    typeCash: "input[value='estPaymentTypeCash']",
    caseMatchedMessage: '#exit-page > section > div > h1',
    nextBtn: "//button[@data-aut='ci_submit-btn']",
    matchPageCheck: "//a[normalize-space()='Upload documentation later']"
};

export const matchedCaseLocators = {
    matchedCaseConsoleLog: "Congratulations, You've Been Matched! element is visible",
    matchedCaseConsoleError: "Congratulations, You've Been Matched! element not visible",
    caseMatchedMessage: `(//h1[normalize-space()="Congratulations, You've Been Matched!"])[1]`,
    uploadDocumentLink: "//a[contains(text(),'Top 5 Types of Documents/Evidence to Gather for Yo')]"
};

export const loginAttorneyPageLocators = {
    loginLink: '.header__nav-item.top-menu__item.header__nav-item',
    logInAfterCasePost: "//a[normalize-space()='Log In']",
    userField: "//input[@id='userName']",
    passField: "//input[@id='password']",
    logInButton: "input[value='Log In']",
    seachInput: "//input[@id='searchQuery']",
    searchBtn: '#searchSubmit',
    caseTitle: "//th[@class='caseTitle']//a[@href='#']",
    logInAttorneyConsoleLog: 'Case Title ▼ element is visible',
    logInAttorneyConsoleError: 'Case Title ▼ element not visible'
};

export const attorneySearchPageLocators = {
    seachInput: "//input[@id='searchQuery']",
    searchBtn: '#searchSubmit',
    caseTitle: '.case-list-item'
};

export const openTabPageLocators = {
    openTab: "//a[@id='openLink']"
};

export const responseMessagePageLocators = {
    replyButton: "(//a[@id='reply'])[1]",
    selectTemplateDropdown: "//select[@id='tid']",
    selectOption: 'template1',
    subjectMessage: "//input[@id='abbr']",
    messageBody: "//div[@class=' nicEdit-main']",
    sendReplyButton: "//a[normalize-space()='Send Reply']",
    consultationFee: "//input[@id='conFee']",
    consultationValue: '12',
    consultationAppointment: "//input[@id='afterHoursConsultation']",
    respondedTab: "//a[@id='pendingLink']"
};

export const EngageCompleteCaseLocators = {
    respondedTab: "a[id='pendingLink']",
    engageButton: "(//a[normalize-space()='Engage'])[1]",
    engageTab: "(//a[@id='engagedLink'])[1]",
    caseEngageRecord: "//a[normalize-space()='",
    caseEngageMessage: '#declinePrompt',
    completeCaseButton:
        "li[class='complete-button-container'] a[class='btn yes complete complete-case aae-v2-btn aae-v2-btn--primary aae-v2-btn--sm']",
    caseRecordToComplete: '//a[normalize-space()=',
    clickCompleteButton: "//a[@title='Mark case as Complete']",
    caseCompleteMessage: "//div[@id='content']//p[1]"
};
