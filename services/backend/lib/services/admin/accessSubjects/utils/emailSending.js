import { URL, URLSearchParams } from 'url';

import * as deepLinkConstants from '../../../../constants/deepLinks.js';
import emailSender            from '../../../emailSenderSingleton.js';
import config                 from '../../../../config.js';

function sendInviteForUserAuthorization({ email, workspaceName }) {
    const loginDeepLinkUrlObj = new URL(config.deepLinkHostURL);

    loginDeepLinkUrlObj.pathname += `/${deepLinkConstants.ROUTES.LOGIN}`;
    loginDeepLinkUrlObj.search = new URLSearchParams({
        workspaceName,
        apiURL : config.apiURL,
        email
    });

    const loginDeepLinkUrl = loginDeepLinkUrlObj.toString();

    return emailSender.send('INVITE_USER_AUTHORIZE', email, {
        subjectEmail : email,
        deepLink     : loginDeepLinkUrl,
        apiURL       : config.apiURL,
        workspaceName
    });
}

export {
    sendInviteForUserAuthorization
};
