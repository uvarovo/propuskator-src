require('@babel/register');

const path = require('path');
const fs = require('fs-extra');
const cls = require('../lib/cls');
const sequelize = require('../lib/sequelize');
const AdminUser = require('../lib/models/AdminUser');
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
    const dump = await fs.readJSON(path.join(__dirname, '../dump.json'));

    const adminUser = await AdminUser.findOne({
        include: [ AdminUser.AssociationWorkspace ]
    })

    const workspace = adminUser.workspace;

    await adminUser.update({
        login        : dump.adminUsers[0].login,
        passwordHash : dump.adminUsers[0].passwordHash
    });
    await workspace.update({
        accessToken : dump.workspace.accessAPISettings[0].token
    });

    cls.set('workspaceId', workspace.id);
    await AccessScheduleDate.destroy({ where: {} });
    await AccessSchedule.destroy({ where: {} });

    console.log('creating accessSubjects');
    const accessSubjects_newIds_hash = {};
    for(const { id: oldId, ...obj} of dump.workspace.accessSubjects) {
        const { id } = await AccessSubject.create(obj);
        accessSubjects_newIds_hash[oldId] = id;
    }

    console.log('creating accessSubjectTokens');
    const accessSubjectTokens_newIds_hash = {};
    for(const { id: oldId, ...obj} of dump.workspace.accessSubjectTokens) {
        if (obj.accessSubjectId && !accessSubjects_newIds_hash[obj.accessSubjectId]) throw new Error('no entity');
        const { id } = await AccessSubjectToken.create({
            ...obj,
            accessSubjectId: obj.accessSubjectId && accessSubjects_newIds_hash[obj.accessSubjectId]
        });
        accessSubjectTokens_newIds_hash[oldId] = id;
    }

    console.log('creating accessSchedules');
    const accessSchedules_newIds_hash = {};
    for(const { id: oldId, ...obj} of dump.workspace.accessSchedules) {
        const { id } = await AccessSchedule.create({
            ...obj,
            accessScheduleDates: obj.accessScheduleDates.map(({ id, ...v }) => v)
        }, {
            include: [ AccessSchedule.AssociationAccessScheduleDates ]
        });
        accessSchedules_newIds_hash[oldId] = id;
    }

    console.log('creating accessTokenReaders');
    const accessTokenReaders_newIds_hash = {};
    for(const { id: oldId, ...obj} of dump.workspace.accessTokenReaders) {
        const { id } = await AccessTokenReader.create(obj);
        accessTokenReaders_newIds_hash[oldId] = id;
    }

    console.log('creating accessReadersGroups');
    const accessReadersGroups_newIds_hash = {};
    for(const { id: oldId, ...obj} of dump.workspace.accessReadersGroups) {
        const { id } = await AccessReadersGroup.create(obj);
        accessReadersGroups_newIds_hash[oldId] = id;
    }

    console.log('creating accessSettings');
    const accessSettings_newIds_hash = {};
    for(const { id: oldId, ...obj} of dump.workspace.accessSettings) {
        const { id } = await AccessSetting.create(obj);
        accessSettings_newIds_hash[oldId] = id;
    }

    console.log('creating accessLogs');
    const accessLogs_newIds_hash = {};
    for(const { id: oldId, ...obj} of dump.workspace.accessLogs) {
        if (obj.accessTokenReaderId && !accessTokenReaders_newIds_hash[obj.accessTokenReaderId]) throw new Error('no entity');
        if (obj.accessSubjectTokenId && !accessSubjectTokens_newIds_hash[obj.accessSubjectTokenId]) throw new Error('no entity');
        if (obj.accessSubjectId && !accessSubjects_newIds_hash[obj.accessSubjectId]) throw new Error('no entity');
        const { id } = await AccessLog.create({
            ...obj,
            accessTokenReaderId: obj.accessTokenReaderId && accessTokenReaders_newIds_hash[obj.accessTokenReaderId],
            accessSubjectTokenId: obj.accessSubjectTokenId && accessSubjectTokens_newIds_hash[obj.accessSubjectTokenId],
            accessSubjectId: obj.accessSubjectId && accessSubjects_newIds_hash[obj.accessSubjectId]
        });
        accessLogs_newIds_hash[oldId] = id;
    }

    console.log('creating notifications');
    const notifications_newIds_hash = {};
    for(const { id: oldId, ...obj} of dump.workspace.notifications) {
        if (obj.accessSubjectTokenId && !accessSubjectTokens_newIds_hash[obj.accessSubjectTokenId]) throw new Error('no entity');
        if (obj.accessSubjectId && !accessSubjects_newIds_hash[obj.accessSubjectId]) throw new Error('no entity');
        if (obj.accessTokenReaderId && !accessTokenReaders_newIds_hash[obj.accessTokenReaderId]) throw new Error('no entity');
        const { id } = await Notification.create({
            ...obj,
            accessSubjectTokenId: obj.accessSubjectTokenId && accessSubjectTokens_newIds_hash[obj.accessSubjectTokenId],
            accessSubjectId: obj.accessSubjectId && accessSubjects_newIds_hash[obj.accessSubjectId],
            accessTokenReaderId: obj.accessTokenReaderId && accessTokenReaders_newIds_hash[obj.accessTokenReaderId]
        });
        notifications_newIds_hash[oldId] = id;
    }

    console.log('creating settingToSubjectMap');
    for(const { id: oldId, ...obj} of dump.workspace.settingToSubjectMap) {
        if (obj.accessSettingId && !accessSettings_newIds_hash[obj.accessSettingId]) throw new Error('no entity');
        if (obj.accessSubjectId && !accessSubjects_newIds_hash[obj.accessSubjectId]) throw new Error('no entity');
        await SettingToSubjectMap.create({
            ...obj,
            accessSettingId: obj.accessSettingId && accessSettings_newIds_hash[obj.accessSettingId],
            accessSubjectId: obj.accessSubjectId && accessSubjects_newIds_hash[obj.accessSubjectId]
        });
    }

    console.log('creating settingToScheduleMap');
    for(const { id: oldId, ...obj} of dump.workspace.settingToScheduleMap) {
        if (obj.accessSettingId && !accessSettings_newIds_hash[obj.accessSettingId]) throw new Error('no entity');
        if (obj.accessScheduleId && !accessSchedules_newIds_hash[obj.accessScheduleId]) throw new Error('no entity');
        await SettingToScheduleMap.create({
            ...obj,
            accessSettingId: obj.accessSettingId && accessSettings_newIds_hash[obj.accessSettingId],
            accessScheduleId: obj.accessScheduleId && accessSchedules_newIds_hash[obj.accessScheduleId]
        });
    }

    console.log('creating settingToReaderMap');
    for(const { id: oldId, ...obj} of dump.workspace.settingToReaderMap) {
        if (obj.accessSettingId && !accessSettings_newIds_hash[obj.accessSettingId]) throw new Error('no entity');
        if (obj.accessTokenReaderId && !accessTokenReaders_newIds_hash[obj.accessTokenReaderId]) throw new Error('no entity');
        await SettingToReaderMap.create({
            ...obj,
            accessSettingId: obj.accessSettingId && accessSettings_newIds_hash[obj.accessSettingId],
            accessTokenReaderId: obj.accessTokenReaderId && accessTokenReaders_newIds_hash[obj.accessTokenReaderId]
        });
    }

    console.log('creating settingToGroupMap');
    for(const { id: oldId, ...obj} of dump.workspace.settingToGroupMap) {
        if (obj.accessSettingId && !accessSettings_newIds_hash[obj.accessSettingId]) throw new Error('no entity');
        if (obj.accessReadersGroupId && !accessReadersGroups_newIds_hash[obj.accessReadersGroupId]) throw new Error('no entity');
        await SettingToGroupMap.create({
            ...obj,
            accessSettingId: obj.accessSettingId && accessSettings_newIds_hash[obj.accessSettingId],
            accessReadersGroupId: obj.accessReadersGroupId && accessReadersGroups_newIds_hash[obj.accessReadersGroupId]
        });
    }

    console.log('creating groupToReaderMap');
    for(const { id: oldId, ...obj} of dump.workspace.groupToReaderMap) {
        if (obj.accessTokenReaderId && !accessTokenReaders_newIds_hash[obj.accessTokenReaderId]) throw new Error('no entity');
        if (obj.accessReadersGroupId && !accessReadersGroups_newIds_hash[obj.accessReadersGroupId]) throw new Error('no entity');
        await GroupToReaderMap.create({
            ...obj,
            accessTokenReaderId: obj.accessTokenReaderId && accessTokenReaders_newIds_hash[obj.accessTokenReaderId],
            accessReadersGroupId: obj.accessReadersGroupId && accessReadersGroups_newIds_hash[obj.accessReadersGroupId]
        });
    }

    console.log('creating accessTokenToReaderChangesMap');
    for(const { id: oldId, ...obj} of dump.workspace.accessTokenToReaderChangesMap) {
        if (obj.accessTokenReaderId && !accessTokenReaders_newIds_hash[obj.accessTokenReaderId]) throw new Error('no entity');
        await AccessTokenToReaderChangesMap.create({
            ...obj,
            accessTokenReaderId: obj.accessTokenReaderId && accessTokenReaders_newIds_hash[obj.accessTokenReaderId]
        });
    }   
}).then(async () => {
    await sequelize.close();
    process.exit(0);
}, async e => {
    console.log(e);
    await sequelize.close();
    process.exit(1);
});