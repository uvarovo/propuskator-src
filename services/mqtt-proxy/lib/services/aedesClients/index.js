import config from '../../config.js';
import AedesSubjectClient from './SubjectClient';
import AedesAdminUserClient from './AdminUserClient';
import AedesAccessTokenReaderClient from './AccessTokenReaderClient';

const { devices: devicesConfig } = config;

export async function authenticate(client, username, password) {
    const [ type ] = username.split('/');

    if (type === 'user') {
        return AedesSubjectClient.authenticate(client, username, password, {
            maxAdditionalRelaysNumber : devicesConfig.maxAdditionalRelaysNumber
        });
    } else if (type === 'client') {
        return AedesAdminUserClient.authenticate(client, username, password);
    } else if (type === 'reader') {
        return AedesAccessTokenReaderClient.authenticate(client, username, password);
    }

    throw new Error('Bad credintials');
}
