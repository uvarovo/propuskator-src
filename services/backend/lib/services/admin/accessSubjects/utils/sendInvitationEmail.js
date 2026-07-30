import emailSender                         from '../../../emailSenderSingleton';
import { androidAppLink, iosAppLink, apiURL, deepLinkHostURL } from '../../../../config';

export default async ({ email, workspace }) => {
    const deepLink = `${deepLinkHostURL}/REGISTRATION?workspaceName=${workspace.name}&subjectEmail=${email}&apiURL=${apiURL}`;

    return emailSender.send('INVITE_ACCESS_SUBJECT', email, {
        subjectEmail  : email,
        workspaceName : workspace.name,
        deepLink,
        androidAppLink,
        iosAppLink,
        apiURL
    });
};
