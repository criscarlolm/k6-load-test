export const ENV_CONFIG = {
    qa6: {
        baseUrl: 'https://qa6.legalmatch.com',
        ssoUrl: 'https://ssoqa6.legalmatch.com/realms/',
        selectors: {
            mainHeading: 'h1.case-intake-form__header a.case-intake-form__header--link',
            loginLink: '.header__nav-item.top-menu__item.header__nav-item',
            usernameInput: '#userName',
            passwordInput: '#password',
            loginButton: 'input[value="Log In"]',
            dashboardHeader: 'div.cui-label.cui-g-medium',
            dashboardAttorney: 'a[id="newLink"] span span[class="cl aae-nav__case-label aae-v2__nav-link-label"]'
        }
    }
};

export const DEFAULTS = {
    ENV: 'qa6',
    VUS: 1,
    ITERATIONS: 1,
    TIMEOUT: 30000,
    SCREENSHOTS: {
        SSO_REDIRECT: 'sso-redirect-failure.png',
        LOGIN: 'login-failure.png'
    }
};
