require('@babel/register');
require('../../lib/sequelize');

const Workspace = require('./../../lib/models/Workspace');
const AccessTokenReader = require('./../../lib/models/AccessTokenReader');
const testReadersRunner = require('./TestReadersRunner');

(async () => {
    const workspaces = await Workspace.findAll({
        include: [ Workspace.AssociationAdminUser ],
        limit: 10
    });

    for (const workspace of workspaces) {
        await new Promise(res => setTimeout(res, 1000));
        const readers = await AccessTokenReader.findAll({
            where: {
                workspaceId: workspace.id
            },
            limit: 7
        });

        for (const reader of readers) {
            await new Promise(res => setTimeout(res, 500));
            testReadersRunner.startTestReaders({
                workspaceAccessToken  : workspace.accessToken,
                accessTokenReaderCode : reader.code,
                adminUserLogin        : workspace.adminUser.login,
            });
        }
    }
})();
