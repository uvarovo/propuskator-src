require('@babel/register');
require('../../lib/sequelize');

const workspaceSeed = require('../../seeds/WorkspaceSeed');
const adminUserSeed = require('../../seeds/AdminUserSeed');
const accessTokenReaderSeed = require('../../seeds/AccessTokenReaderSeed');
const testReadersRunner = require('./TestReadersRunner');

const { READERS_QUANTITY } = require('./etc/config');

(async () => {
    const workspace = await workspaceSeed.create();
    const adminUser = await adminUserSeed.create({ related: { workspace } });

    for (let i = 0; i < READERS_QUANTITY; i++) {
        const accessTokenReader = await accessTokenReaderSeed.create({ related: { workspace } });

        testReadersRunner.startTestReaders({
            workspaceAccessToken  : workspace.accessToken,
            accessTokenReaderCode : accessTokenReader.code,
            adminUserLogin        : adminUser.login,
        });
    }
})();
