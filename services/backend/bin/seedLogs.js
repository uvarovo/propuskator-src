/* eslint-disable import/no-commonjs */
/* eslint-disable import/no-extraneous-dependencies */
require('@babel/register');
const readline = require('readline');
const faker = require('faker');
const sequelize = require('../lib/sequelize');
const AdminUser = require('../lib/models/AdminUser');
const AccessLog = require('../lib/models/AccessLog');
const AccessTokenReader = require('../lib/models/AccessTokenReader');
const AccessSubjectToken = require('../lib/models/AccessSubjectToken');
const AccessSubject = require('../lib/models/AccessSubject');
const getRandomColor = require('../lib/services/utils/colors');

const rl = readline.createInterface({
    input  : process.stdin,
    output : process.stdout
});

const logCount = process.argv[2] || 3;


rl.question(`Create ${logCount} access logs? [y/n]`, async (input) => {
    if (input.toLowerCase() === 'y') {
        try {
            await cretaeLogs(logCount);
        } catch (e) {
            console.error(e);
        }
    }

    rl.close();
});

async function cretaeLogs(count) {
    // eslint-disable-next-line more/no-c-like-loops
    for (let i = 0; i < count; i++) {
        const { workspaceId } = await AdminUser.findOne({ where: { login: { [sequelize.Op.like]: '%admin%' } } });
        const firstName = faker.name.firstName();
        const lastName = faker.name.lastName();
        const subject = await AccessSubject.create({
            workspaceId,
            name        : `${lastName} ${firstName}`,
            email       : faker.internet.email(),
            avatarColor : getRandomColor()
        });

        const reader = await AccessTokenReader.create({
            workspaceId,
            code        : getRandomString(),
            name        : getRandomString(),
            stateStatus : AccessTokenReader.STATE_ACTIVE
        });

        const tokenTypes = [ AccessSubjectToken.TYPE_NFC, AccessSubjectToken.TYPE_RFID ];

        const tokenType = tokenTypes[i % 2];

        const tokenCode = getRandomString();
        const token = await AccessSubjectToken.create({
            workspaceId,
            accessSubjectId : subject.id,
            name            : tokenCode,
            code            : tokenCode,
            type            : tokenType
        });

        const statuses = [ AccessLog.STATUS_SUCCESS, AccessLog.STATUS_DENIED ];

        const randomLogStatus = statuses[i % 2];

        await AccessLog.create({
            workspaceId,
            accessTokenReaderId  : reader.id,
            accessSubjectTokenId : token.id,
            accessSubjectId      : subject.id,
            status               : randomLogStatus,
            attemptedAt          : faker.date.past(),
            createdAt            : faker.date.past()
        });

        console.log(i + 1);
    }
}

rl.on('close', () => {
    process.exit(0);
});

function getRandomString() {
    return Math.random().toString(36).substring(2);
}
