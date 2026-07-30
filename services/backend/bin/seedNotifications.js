/* eslint-disable import/no-commonjs,no-template-curly-in-string */
/* eslint-disable import/no-extraneous-dependencies, more/no-duplicated-chains */
// example of run command :
// npm run seed:notifications count=7 tokenCode=FEWKFFWF useOldToken=true
require('@babel/register');
const readline           = require('readline');
const faker              = require('faker');
const handlebars         = require('handlebars');
const sequelize          = require('../lib/sequelize');
const AdminUser          = require('../lib/models/AdminUser');
const Notification       = require('../lib/models/Notification');
const AccessTokenReader  = require('../lib/models/AccessTokenReader');
const AccessSubject      = require('../lib/models/AccessSubject');
const AccessSubjectToken = require('../lib/models/AccessSubjectToken');
const getRandomColor     = require('../lib/services/utils/colors');


const MESSAGE_TEMPLATE_BY_TYPE  = {
    [Notification.types.ACCESS_ATTEMPTS.UNAUTH_SUBJECT_ACCESS]     : 'Точкой доступа {{readerName}} зафиксирован несанкционированный доступ с мобильного устройства субьектом {{subjectName}}',
    [Notification.types.ACCESS_ATTEMPTS.UNAUTH_SUBJECT_PHN_ACCESS] : 'Точкой доступа {{readerName}} зафиксирован несанкционированный доступ субьектом  {{subjectName}} с помощью телефонного звонка',
    [Notification.types.ACCESS_ATTEMPTS.UNAUTH_ACCESS]             : 'Точкой доступа {{readerName}} зафиксирован несанкционированный доступ для токена {{tokenCode}}',
    [Notification.alwaysEnabledTypes.UNKNOWN_TOKEN]                : 'Точкой доступа {{readerName}} считан неизвестный токен {{tokenCode}}',
    [Notification.alwaysEnabledTypes.NEW_READER]                   : 'Обнаружена точка доступа {{tokenReaderCode}}',
    [Notification.types.READER_STATE.ACTIVE_READER]                : 'Точка доступа {{readerName}} включена',
    [Notification.types.READER_STATE.INACTIVE_READER]              : 'Точка доступа {{readerName}} недоступна',
    [Notification.types.USER_ACTIONS.DELETED_SUBJECT_PROFILE]      : 'Субъект {{accessSubjectName}} удалил свой профиль'
};
const NOTIFICATION_QUANTITY = Object.keys(MESSAGE_TEMPLATE_BY_TYPE).length;

const rl = readline.createInterface({
    input  : process.stdin,
    output : process.stdout
});

let notificationCount = process.argv.find(p => p.split('=')[0] === 'count');

let passedTokenCode = process.argv.find(p => p.split('=')[0] === 'tokenCode');

let useOldToken = process.argv.find(p => p.split('=')[0] === 'useOldToken');

notificationCount = notificationCount ? notificationCount.split('=')[1] : NOTIFICATION_QUANTITY;
passedTokenCode = passedTokenCode ? passedTokenCode.split('=')[1] : null;
useOldToken = useOldToken ? useOldToken.split('=')[1] : false;

useOldToken = useOldToken === 'true';

rl.question(`Create ${notificationCount} notifications? [y/n]`, async (input) => {
    if (input.toLowerCase() === 'y') {
        try {
            await createNotifications(notificationCount);
        } catch (e) {
            console.error(e);
        }
    }

    rl.close();
});

function getMessage(type, data) {
    const template = MESSAGE_TEMPLATE_BY_TYPE[type];

    if (!template) throw new Error('No template found');

    const message = handlebars.compile(template);

    return message(data);
}

async function createNotifications(count) {
    const { workspaceId } = await AdminUser.findOne({ where: { login: { [sequelize.Op.like]: '%admin%' } } });

    // eslint-disable-next-line more/no-c-like-loops
    for (let i = 0; i < count; i++) {
        let accessTokenReader = null;

        const tokenReaderCode = getRandomCode();

        const types = [
            Notification.types.ACCESS_ATTEMPTS.UNAUTH_SUBJECT_ACCESS,
            Notification.types.ACCESS_ATTEMPTS.UNAUTH_SUBJECT_PHN_ACCESS,
            Notification.types.ACCESS_ATTEMPTS.UNAUTH_ACCESS,
            Notification.alwaysEnabledTypes.UNKNOWN_TOKEN,
            Notification.alwaysEnabledTypes.NEW_READER,
            Notification.types.READER_STATE.ACTIVE_READER,
            Notification.types.READER_STATE.INACTIVE_READER,
            Notification.types.USER_ACTIONS.DELETED_SUBJECT_PROFILE
        ];

        const type = types[i % NOTIFICATION_QUANTITY];

        let data = null;

        if (type !== Notification.alwaysEnabledTypes.NEW_READER) {
            accessTokenReader = await AccessTokenReader.create({
                workspaceId,
                name : getRandomCode(),
                code : getRandomCode()
            });
        }

        let subject = null;

        let subjectToken = null;

        const code = passedTokenCode || getRandomCode();

        if ([
            Notification.types.ACCESS_ATTEMPTS.UNAUTH_SUBJECT_ACCESS,
            Notification.types.USER_ACTIONS.DELETED_SUBJECT_PROFILE,
            Notification.types.ACCESS_ATTEMPTS.UNAUTH_SUBJECT_PHN_ACCESS
        ].includes(type)) {
            // eslint-disable-next-line no-sync
            const avatar = null; // i % 6 === 0 ? fs.readdirSync('./storage/access-subjects')[0] : null;
            const firstName = faker.name.firstName();
            const lastName = faker.name.lastName();

            subject = await AccessSubject.create({
                workspaceId,
                name         : `${lastName} ${firstName}`,
                email        : faker.internet.email(),
                phoneEnabled : true,
                phone        : '+380682341231',
                avatarColor  : getRandomColor(),
                avatar
            });
            data = {};
        } else if (type === Notification.types.ACCESS_ATTEMPTS.UNAUTH_ACCESS) {
            // eslint-disable-next-line no-sync
            const avatar = null; // i % 6 === 0 ? fs.readdirSync('./storage/access-subjects')[0] : null;
            const firstName = faker.name.firstName();
            const lastName = faker.name.lastName();

            subject = await AccessSubject.create({
                workspaceId,
                name        : `${lastName} ${firstName}`,
                email       : faker.internet.email(),
                avatarColor : getRandomColor(),
                avatar
            });
            subjectToken = await _getToken({ workspaceId, code, subject });
            data = {
                tokenCode : code
            };
        } else if (type === Notification.alwaysEnabledTypes.NEW_READER) {
            data = {
                tokenReaderCode
            };
        } else {
            data = {
                tokenCode : code
            };
        }

        let notificationData;

        switch (type) {
            case Notification.types.ACCESS_ATTEMPTS.UNAUTH_SUBJECT_ACCESS:
                notificationData = {
                    readerName  : accessTokenReader.name,
                    subjectName : subject.name
                };
                break;

            case Notification.types.ACCESS_ATTEMPTS.UNAUTH_ACCESS:
                notificationData = {
                    readerName : accessTokenReader.name,
                    tokenCode  : code
                };
                break;

            case Notification.types.ACCESS_ATTEMPTS.UNAUTH_SUBJECT_PHN_ACCESS:
                notificationData = {
                    readerName : accessTokenReader.name,
                    tokenCode  : code
                };
                break;

            case Notification.alwaysEnabledTypes.UNKNOWN_TOKEN:
                notificationData = {
                    readerName : accessTokenReader.name,
                    tokenCode  : getRandomCode()
                };
                break;

            case Notification.alwaysEnabledTypes.NEW_READER:
                notificationData = {
                    tokenReaderCode
                };
                break;

            case Notification.types.READER_STATE.ACTIVE_READER:
                notificationData = {
                    readerName : accessTokenReader.name
                };
                break;

            case Notification.types.READER_STATE.INACTIVE_READER:
                notificationData = {
                    readerName : accessTokenReader.name
                };
                break;

            case Notification.types.USER_ACTIONS.DELETED_SUBJECT_PROFILE:
                notificationData = {
                    accessSubjectName : subject.name
                };
                break;

            default:
                break;
        }

        await Notification.create({
            workspaceId,
            accessTokenReaderId  : accessTokenReader ? accessTokenReader.id : null,
            accessSubjectId      : subject ? subject.id : null,
            accessSubjectTokenId : subjectToken ? subjectToken.id : null,
            type,
            isRead               : [ i % 2 ],
            message              : getMessage(type, notificationData),
            data
        });

        console.log(i + 1);
    }
}

rl.on('close', () => {
    process.exit(0);
});

function getRandomCode() {
    const str = Math.random().toString(36).substring(2);

    return str.toUpperCase();
}

function _getToken({ workspaceId, code, subject }) {
    if (useOldToken) {
        return AccessSubjectToken.findOne({ where: { code } });
    }

    return AccessSubjectToken.create({
        workspaceId,
        name            : code,
        code,
        type            : 'RFID',
        accessSubjectId : subject.id
    });
}
