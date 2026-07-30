require('@babel/register');

const path = require('path');
const fs = require('fs-extra');
const sequelize = require('../lib/sequelize');
const AdminUser = require('../lib/models/AdminUser');
const AccessAPISetting = require('../lib/models/AccessAPISetting');
const AccessSubjectToken = require('../lib/models/AccessSubjectToken');
const AccessReadersGroup = require('../lib/models/AccessReadersGroup');
const AccessTokenReader = require('../lib/models/AccessTokenReader');
const AccessSubject = require('../lib/models/AccessSubject');
const AccessSchedule = require('../lib/models/AccessSchedule');
const AccessScheduleDate = require('../lib/models/AccessScheduleDate');
const AccessSetting = require('../lib/models/AccessSetting');
const AccessLog = require('../lib/models/AccessLog');
const Notification = require('../lib/models/Notification');
const AccessTokenToReaderChangesMap = require('../lib/models/AccessTokenToReaderChangesMap');
const SettingToSubjectMap = require('../lib/models/mappings/SettingToSubjectMap');
const SettingToScheduleMap = require('../lib/models/mappings/SettingToScheduleMap');
const SettingToReaderMap = require('../lib/models/mappings/SettingToReaderMap');
const SettingToGroupMap = require('../lib/models/mappings/SettingToGroupMap');
const GroupToReaderMap = require('../lib/models/mappings/GroupToReaderMap');

sequelize.transaction(async () => {
    const dump = {};

    dump.adminUsers = (await AdminUser.findAll()).map(v => v.toJSON());
    dump.workspace = {
        accessAPISettings: (await AccessAPISetting.findAll()).map(v => v.toJSON()),
        accessSubjects: (await AccessSubject.findAll()).map(v => v.toJSON()),
        accessSubjectTokens: (await AccessSubjectToken.findAll()).map(v => v.toJSON()),
        accessTokenReaders: (await AccessTokenReader.findAll()).map(v => v.toJSON()),
        accessReadersGroups: (await AccessReadersGroup.findAll()).map(v => v.toJSON()),
        accessSchedules: (await AccessSchedule.findAll({
            include: [ AccessSchedule.AssociationAccessScheduleDates ]
        })).map(v => v.toJSON()),
        accessSettings: (await AccessSetting.findAll()).map(v => v.toJSON()),
        accessLogs: (await AccessLog.findAll()).map(v => v.toJSON()),
        notifications: (await Notification.findAll()).map(v => v.toJSON()),
        accessTokenToReaderChangesMap: (await AccessTokenToReaderChangesMap.findAll()).map(v => v.toJSON()),
        settingToSubjectMap: (await SettingToSubjectMap.findAll()).map(v => v.toJSON()),
        settingToScheduleMap: (await SettingToScheduleMap.findAll()).map(v => v.toJSON()),
        settingToReaderMap: (await SettingToReaderMap.findAll()).map(v => v.toJSON()),
        settingToGroupMap: (await SettingToGroupMap.findAll()).map(v => v.toJSON()),
        groupToReaderMap: (await GroupToReaderMap.findAll()).map(v => v.toJSON())
    }


    await fs.writeJSON(path.join(__dirname, '../dump.json'), dump);
    console.log(JSON.stringify(dump));
}).then(async () => {
    await sequelize.close();
    process.exit(0);
}, async e => {
    console.log(e);
    await sequelize.close();
    process.exit(1);
});