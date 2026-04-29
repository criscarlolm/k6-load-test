import { Rate } from 'k6/metrics';

export const metrics = {
    ssoRedirectFailure: new Rate('sso_redirect_failure_rate'),
    loginFailure: new Rate('login_failure_rate')
};
