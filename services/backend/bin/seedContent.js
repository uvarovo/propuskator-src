/* eslint-disable import/no-commonjs */
/* eslint-disable import/no-extraneous-dependencies */
require('@babel/register');
require('../lib/sequelize');
const readline           = require('readline');
const faker              = require('faker');
const initModels         = require('../lib/models/initModels');
const AccessSubjectToken = require('../lib/models/AccessSubjectToken');
const AccessSubject      = require('../lib/models/AccessSubject');
const AccessSchedule     = require('../lib/models/AccessSchedule');
const AccessReadersGroup = require('../lib/models/AccessReadersGroup');
const AccessTokenReader  = require('../lib/models/AccessTokenReader');
const AccessSetting      = require('../lib/models/AccessSetting');
const config             = require('../lib/config');
const getRandomColor     = require('../lib/services/utils/colors');

const rl = readline.createInterface({
    input  : process.stdin,
    output : process.stdout
});

initModels(config.db);

const count = process.argv[2] || 3;

rl.question(`Create ${count} access? [y/n]`, async (input) => {
    if (input.toLowerCase() === 'y') {
        await createAccess(count);
    }

    rl.close();
});

async function createAccess(amount) {
    // eslint-disable-next-line more/no-c-like-loops
    for (let i = 0; i < amount; i++) {
        const token = await AccessSubjectToken.create({
            code : getRandomUUID(),
            type : 'RFID'
        });

        // console.log({ token });

        const firstName = faker.name.firstName();
        const lastName = faker.name.lastName();

        const subject = await AccessSubject.create({
            name        : `${lastName} ${firstName}`,
            email       : faker.internet.email(),
            avatarColor : getRandomColor()
        });

        // console.log({ subject });

        await subject.connectAccessSubjectTokens([ token.id ]);

        const scheduleJSON = {
            'name'        : getRandomUUID(),
            'repeatType'  : 'WEEKLY',
            'repeatValue' : 1,
            'dates'       : [
                {
                    'id'         : '026682e0-5406-458b-a7a9-b9447d24043d',
                    'scheduleId' : '99755dad-6142-4ae6-91c4-b74640cca852',
                    'startTime'  : '10:00:00',
                    'endTime'    : '18:00:00',
                    'date'       : null,
                    'dayOfWeek'  : 5,
                    'weekNumber' : null,
                    'dayOfMonth' : null
                },
                {
                    'id'         : '7fbcd79f-9627-408b-9908-951182181ed6',
                    'scheduleId' : '99755dad-6142-4ae6-91c4-b74640cca852',
                    'startTime'  : '10:00:00',
                    'endTime'    : '18:00:00',
                    'date'       : null,
                    'dayOfWeek'  : 2,
                    'weekNumber' : null,
                    'dayOfMonth' : null
                },
                {
                    'id'         : '87ad405e-a8b3-4eea-8214-b517d222c4fc',
                    'scheduleId' : '99755dad-6142-4ae6-91c4-b74640cca852',
                    'startTime'  : '10:00:00',
                    'endTime'    : '18:00:00',
                    'date'       : null,
                    'dayOfWeek'  : 4,
                    'weekNumber' : null,
                    'dayOfMonth' : null
                },
                {
                    'id'         : 'd0f78485-eb8f-4d6a-93c5-5c48b4f12f92',
                    'scheduleId' : '99755dad-6142-4ae6-91c4-b74640cca852',
                    'startTime'  : '10:00:00',
                    'endTime'    : '18:00:00',
                    'date'       : null,
                    'dayOfWeek'  : 3,
                    'weekNumber' : null,
                    'dayOfMonth' : null
                },
                {
                    'id'         : 'fd30c80f-c609-4552-8c76-d24fbd21dbb7',
                    'scheduleId' : '99755dad-6142-4ae6-91c4-b74640cca852',
                    'startTime'  : '10:00:00',
                    'endTime'    : '18:00:00',
                    'date'       : null,
                    'dayOfWeek'  : 1,
                    'weekNumber' : null,
                    'dayOfMonth' : null
                }
            ]
        };

        const schedule = await AccessSchedule.create(scheduleJSON);

        // await schedule.connectAccessScheduleDates(scheduleJSON.dates);

        // console.log({ schedule });

        const group = await AccessReadersGroup.create({
            name  : getRandomUUID(),
            color : getRandomColor()
        });

        // console.log({ group });

        const reader = await AccessTokenReader.create({
            name                  : getRandomUUID(),
            code                  : getRandomUUID(),
            accessReadersGroupIds : [ group.id ]
        });

        // console.log({ reader });

        const accessSetting = await AccessSetting.create({
            accessSubjectIds     : [ subject.id ],
            accessScheduleIds    : [ schedule.id ],
            accessTokenReaderIds : [ reader.id ]
        });

        await accessSetting.connectAccessSubjects([ subject.id ]);
        await accessSetting.connectAccessSchedules([ schedule.id ]);
        await accessSetting.connectAccessTokenReaders([ reader.id ]);

        // console.log({ accessSetting });

        console.log(i + 1);
    }
}

rl.on('close', () => {
    process.exit(0);
});

function getRandomUUID() {
    return faker.random.uuid();
}
