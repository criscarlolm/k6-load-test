import { randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';
let textSummary = 'K6 Load Browser Test';
let textDescription = `Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.`;
let firstNameValue = 'FirstName';
let lastNameValue = 'LastName';
let randomVarSummary = randomString(8);
let randomVarDescription = randomString(10);
const summaryCaseValue = `${textSummary} ${randomVarSummary}`;
const descriptionCaseValue = `${textDescription} ${randomVarDescription}`;
const firtName = `${firstNameValue}${randomVarSummary}`;
const lastName = `${lastNameValue}${randomVarSummary}`;

export const data = {
    username: 'testattorneyauto',
    password: 'aut0b0t1'
};

export const checkVerification = {
    checkHomePage: 'Find the Right Lawyer for Your Legal Issue!'
};

export const searchAttorney = {
    zipCode: '00001'
};

export const descriptionText = {
    summary: summaryCaseValue,
    description: descriptionCaseValue
};

export const saveCaseForm = {
    firstName: firtName,
    lastName: lastName,
    zipCode: '00001',
    telNumber: '4354355345',
    emailAddress: 'loadtest1001@yopmail.com'
};

export const httpMetrics = {
    casePostEnv: `https://${__ENV.METRICS_CASE_POST}.legalmatch.com/case-post/env`,
    casePostRest: `https://ccpm${__ENV.METRICS_CCPM}.legalmatch.com:3010/case-post/rest`,
    casePostExitTest: `https://${__ENV.METRICS_CASE_POST_EXIT}.legalmatch.com/case-post/exit/test`,
    homeAttorneyLogin: `https://${__ENV.METRICS_ATTORNEY_LOGIN}.legalmatch.com/sign_in.html`,
    responseCase: `https://${__ENV.METRICS_SAVE_RESPONSE_CASE}.legalmatch.com/home/ia/dyna/saveResponse.do`,
    enagageCase: `https:/${__ENV.METRICS_ENGAGE_CASE}.legalmatch.com/home/ia/dyna/engageCase.do`,
    completeCase: `https://${__ENV.METRICS_COMPLETE_CASE}.legalmatch.com/home/ia/dyna/completeCase.do`
};

export const httpCasePostingMetrics = {
    casePostEnv: `https://${__ENV.METRICS_CASE_POST}.legalmatch.com/case-post/env`,
    casePostRest: `https://ccpm${__ENV.METRICS_CCPM}.legalmatch.com:3010/case-post/rest`,
    casePostExitTest: `https://${__ENV.METRICS_CASE_POST_EXIT}.legalmatch.com/case-post/exit/test`
};

// SSO URLs configuration for different QA environments
export const ssoUrls = {
    prod: 'https://ssoprod.legalmatch.com/realms/',
    test: 'https://ssotest.legalmatch.com/realms/',
    qa1: 'https://ssoqa1.legalmatch.com/realms/',
    qa2: 'https://ssoqa2.legalmatch.com/realms/',
    qa3: 'https://ssoqa3.legalmatch.com/realms/',
    qa4: 'https://ssoqa4.legalmatch.com/realms/',
    qa5: 'https://ssoqa5.legalmatch.com/realms/',
    qa6: 'https://ssoqa6.legalmatch.com/realms/',
    qa7: 'https://ssoqa7.legalmatch.com/realms/',
    qa8: 'https://ssoqa8.legalmatch.com/realms/',
    qa9: 'https://ssoqa9.legalmatch.com/realms/',
    qa10: 'https://ssoqa10.legalmatch.com/realms/',
    qa11: 'https://ssoqa11.legalmatch.com/realms/',
    dev0: 'https://ssodev0.legalmatch.com/realms/',
    dev1: 'https://ssodev1.legalmatch.com/realms/'
};

// Get SSO URL for a specific environment
export function getSsoUrl(environment) {
    if (!ssoUrls[environment]) {
        throw new Error(`Invalid environment: ${environment}. Valid environments are: ${Object.keys(ssoUrls).join(', ')}`);
    }
    return ssoUrls[environment];
}

// Validate if a URL matches the SSO pattern for a given environment
export function isValidSsoUrl(url, environment) {
    const ssoUrl = getSsoUrl(environment);
    return url.startsWith(ssoUrl);
}
