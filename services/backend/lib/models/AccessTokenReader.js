/* eslint-disable func-style */
/* eslint-disable no-param-reassign,prefer-template */
import { DataTypes as DT, Op, fn as sequelizeFn, col as sequelizeCol } from 'sequelize';

import _Flatten                from 'lodash/flatten';
import _Uniq                   from 'lodash/uniq';

import sequelize                       from '../sequelizeSingleton';
import mqttTransport                   from '../services/mqttTransportSingleton';
import { ACTION_TYPES }                from '../constants/accessTokenToReaderChangesMap.js';
import Base                            from './WorkspaceModelBase';
import AccessReadersGroup              from './AccessReadersGroup';
import GroupToReaderMap                from './mappings/GroupToReaderMap';
import SettingToReaderMap              from './mappings/SettingToReaderMap';
import CameraToReaderMap               from './mappings/CameraToReaderMap';
import AccessSetting                   from './AccessSetting';
import AccessTokenToReaderChangesMap   from './AccessTokenToReaderChangesMap';
import AccessSubject                   from './AccessSubject';
import UserAccessTokenReader           from './UserAccessTokenReader';
import MqttUser                        from './MqttUser';
import MqttAcl                         from './MqttAcl';
import { createHash }                  from './utils';
import { TimeoutError, OpenDoorError } from './utils/DX';
import Workspace                       from './Workspace';
import AdminUser                       from './AdminUser';
import AccessCamera                    from './AccessCamera';
import UsersGroupAccessTokenReader     from './UsersGroupAccessTokenReader.js';
import ReaderDisplayedTopic            from './ReaderDisplayedTopic.js';

class AccessTokenReader extends Base {
    static STATE_DISCONNECTED = 'DISCONNECTED'
    static STATE_ACTIVE = 'ACTIVE'
    static STATE_INACTIVE = 'INACTIVE'

    static BROKER_STATE_DISCONNECTED = 'disconnected'
    static BROKER_STATE_READY = 'ready'

    static initRelations() {
        super.initRelations();
        this.AssociationAccessReadersGroups = this.belongsToMany(AccessReadersGroup, { through: GroupToReaderMap, as: 'accessReadersGroups', foreignKey: 'accessTokenReaderId', otherKey: 'accessReadersGroupId' });
        this.AssociationGroupToReaderMap = this.hasMany(GroupToReaderMap, { as: 'groupToReaderMap', foreignKey: 'accessTokenReaderId' });

        this.AssociationAccessSettings = this.belongsToMany(AccessSetting, { through: SettingToReaderMap, as: 'accessSettings', foreignKey: 'accessTokenReaderId', otherKey: 'accessSettingId' });
        this.AssociationSettingToReaderMap = this.hasMany(SettingToReaderMap, { as: 'settingToReaderMap', foreignKey: 'accessTokenReaderId' });
        this.AssociationUserAccessTokenReader = this.hasMany(UserAccessTokenReader, { as: 'userAccessTokenReader', foreignKey: 'accessTokenReaderId' });
        this.AssociationUsersGroupAccessTokenReader = this.hasMany(UsersGroupAccessTokenReader, { as: 'usersGroupsAccessTokenReaders', foreignKey: 'accessTokenReaderId' });

        this.AssociationSyncChanges = this.hasMany(AccessTokenToReaderChangesMap, { as: 'syncChanges', foreignKey: 'accessTokenReaderId' });

        // needs to be improved: make one-to-many association without "join table"
        // cameratoreadermap to have a direct access to the AccessCamera model
        this.AssociationAccessCamera = this.belongsToMany(AccessCamera, {
            through : CameraToReaderMap,
            as      : 'accessCameras'
        });
        this.AssociationReaderDisplayedTopic = this.hasMany(ReaderDisplayedTopic, {
            as         : 'displayedTopics',
            foreignKey : 'accessTokenReaderId'
        });
    }

    async getAssociatedEntitiesData(options) {
        let accessSettings = await this.getAccessSettings({
            ...options,
            attributes : [ 'id' ],
            include    : [
                {
                    association : AccessSetting.AssociationAccessSubjects,
                    include     : [ {
                        association : AccessSubject.AssociationAccessSubjectTokens,
                        attributes  : [ 'id', 'code' ],
                        required    : false
                    } ],
                    attributes : [ 'id', 'mobileEnabled', 'phoneEnabled', 'phoneToken', 'mobileToken', 'virtualCode' ],
                    required   : false
                }
            ]
        });

        const accessReadersGroups = await this.getAccessReadersGroups({
            ...options,
            attributes : [ 'id' ],
            include    : [
                {
                    association : AccessReadersGroup.AssociationAccessSettings,
                    attributes  : [ 'id' ],
                    include     : [
                        {
                            association : AccessSetting.AssociationAccessSubjects,
                            include     : [ {
                                association : AccessSubject.AssociationAccessSubjectTokens,
                                attributes  : [ 'id', 'code' ],
                                required    : false
                            } ],
                            attributes : [ 'id', 'mobileEnabled', 'virtualCode', 'phoneEnabled', 'phoneToken', 'mobileToken' ]
                        }
                    ]
                }
            ]
        });

        accessSettings = [
            ...accessSettings,
            ..._Flatten(accessReadersGroups.map((accessReadersGroup) => accessReadersGroup.accessSettings))
        ];

        const accessTokenReaderIds = [ this.id ];
        const accessSubjectTokenCodes = _Uniq([
            ..._Flatten(accessSettings.map(({ accessSubjects }) => {
                return [
                    ..._Flatten(accessSubjects.map(({ accessSubjectTokens }) => {
                        return accessSubjectTokens ? accessSubjectTokens.map(({ code }) => code) : [];
                    })),
                    ...accessSubjects.filter(({ mobileEnabled }) => mobileEnabled).map(({ mobileToken }) => mobileToken), // eslint-disable-line max-len
                    ...accessSubjects.filter(({ phoneEnabled }) => phoneEnabled).map(({ phoneToken }) => phoneToken)
                ];
            }))
        ]);

        return {
            accessTokenReaderIds,
            accessSubjectTokenCodes
        };
    }

    async updateReaderTokens(options, { actionType } = {}) {
        const { accessTokenReaderIds, accessSubjectTokenCodes } = await this.getAssociatedEntitiesData(options);

        await AccessTokenToReaderChangesMap.addUpdates(
            {
                accessTokenReaderIds,
                accessSubjectTokenCodes,
                actionType
            },
            options
        );
    }

    static async findAllByParams({ ids, limit, offset, sortedBy, order, ...filters }, options = {}) {
        const filterScopes = [
            { method: [ 'ids', ids ] },
            { method: [ 'search', filters.search ] },
            { method: [ 'enabled', filters.enabled ] },
            { method: [ 'isArchived', filters.isArchived ] },
            { method: [ 'stateStatus', filters.stateStatus ] },
            { method: [ 'connectionStatus', filters.connectionStatus ] },
            { method: [ 'accessReadersGroupIds', filters.accessReadersGroupIds ] },
            { method : [ 'updateDates', {
                updateStart : filters.updateStart,
                updateEnd   : filters.updateEnd
            } ] },
            { method : [ 'createDates', {
                createStart : filters.createStart,
                createEnd   : filters.createEnd
            } ] }
        ];

        const { rows, count } = await AccessTokenReader.scope(filterScopes).findAndCountAll({
            ...options,
            ...(ids) ? {} : { limit, offset },
            include : [
                {
                    association : AccessTokenReader.AssociationAccessReadersGroups,
                    attributes  : [],
                    required    : false
                }
            ],
            group      : [ 'AccessTokenReader.id' ],
            attributes : [ 'id' ],
            order      : [ [ sortedBy, order ], [ 'id', 'ASC' ] ],
            subQuery   : false,
            distinct   : true
        });

        const associationsToInclude = [
            {
                association : AccessTokenReader.AssociationAccessReadersGroups,
                required    : false
            },
            {
                association : AccessTokenReader.AssociationSyncChanges,
                required    : false
            },
            {
                association : AccessTokenReader.AssociationReaderDisplayedTopic,
                required    : false
            }
        ];

        if (filters.hasAssignedCamera !== undefined) {
            associationsToInclude.push({
                association : AccessTokenReader.AssociationAccessCamera,
                required    : false
            });
        }

        let accessTokenReaders = rows.length ? await AccessTokenReader.findAll({
            where : {
                id : rows.map(({ id }) => id)
            },
            include : associationsToInclude,
            order   : [ [ sortedBy, order ], [ 'id', 'ASC' ] ]
        }) : [];

        if (filters.hasAssignedCamera !== undefined) {
            accessTokenReaders = accessTokenReaders.filter(reader => filters.hasAssignedCamera ?
                reader.accessCameras.length :
                !reader.accessCameras.length
            );

            accessTokenReaders.forEach(reader => delete reader.accessCameras);
        }

        return { accessTokenReaders, count: count && count.length || 0 };
    }
    static connectionStatusesTitles = {
        ACTIVE             : 'Active',
        SLEEPING           : 'Sleeping',
        INIT               : 'Init',
        CONNECTION_PROBLEM : 'Connection problem',
        INACTIVE           : 'Inactive'
    }
    static connectionStatusesMap = [ // for finding corresponding connectionStatus
        {
            brokerStateStatus : AccessTokenReader.BROKER_STATE_READY,
            stateStatus       : AccessTokenReader.STATE_ACTIVE,
            color             : 'green',
            title             : this.connectionStatusesTitles.ACTIVE
        },
        {
            brokerStateStatus : AccessTokenReader.BROKER_STATE_READY,
            stateStatus       : AccessTokenReader.STATE_DISCONNECTED,
            color             : 'yellow',
            title             : this.connectionStatusesTitles.SLEEPING
        },
        {
            brokerStateStatus : AccessTokenReader.BROKER_STATE_READY,
            stateStatus       : AccessTokenReader.STATE_INACTIVE,
            color             : 'yellow',
            title             : this.connectionStatusesTitles.INIT
        },
        {
            brokerStateStatus : AccessTokenReader.BROKER_STATE_DISCONNECTED,
            stateStatus       : AccessTokenReader.STATE_ACTIVE,
            color             : 'yellow',
            title             : this.connectionStatusesTitles.CONNECTION_PROBLEM
        },
        {
            brokerStateStatus : AccessTokenReader.BROKER_STATE_DISCONNECTED,
            stateStatus       : AccessTokenReader.STATE_DISCONNECTED,
            color             : 'red',
            title             : this.connectionStatusesTitles.INACTIVE
        },
        {
            brokerStateStatus : AccessTokenReader.BROKER_STATE_DISCONNECTED,
            stateStatus       : AccessTokenReader.STATE_INACTIVE,
            color             : 'yellow',
            title             : this.connectionStatusesTitles.INIT
        },
        {
            brokerStateStatus : null,
            stateStatus       : AccessTokenReader.STATE_ACTIVE,
            color             : 'yellow',
            title             : this.connectionStatusesTitles.CONNECTION_PROBLEM
        },
        {
            brokerStateStatus : null,
            stateStatus       : AccessTokenReader.STATE_DISCONNECTED,
            color             : 'yellow',
            title             : this.connectionStatusesTitles.INACTIVE
        },
        {
            brokerStateStatus : null,
            stateStatus       : AccessTokenReader.STATE_INACTIVE,
            color             : 'yellow',
            title             : this.connectionStatusesTitles.INIT
        }
    ]

    static async getAllUsedPhones() {
        const models = await AccessTokenReader.findAll({
            attributes : [
                [ sequelizeFn('DISTINCT', sequelizeCol('phone')), 'phone' ]
            ]
        });

        return models.filter(m => m.phone).map(m => m.phone);
    }

    async getMqttCredentials() {
        const { accessToken: token, adminUser: { rootTopic }  } = await this.getWorkspace({
            include : [ Workspace.AssociationAdminUser ]
        });

        return {
            rootTopic,
            username : `reader/${rootTopic}/${this.code}`,
            password : token
        };
    }
    async hanldeCodeChanged() {
        // const { accessToken: token, name: workspaceName } = await this.getWorkspace();
        const { rootTopic, username: mqttUsername, password: mqttPassword } = await this.getMqttCredentials();
        const mqttPasswordHash = createHash(mqttPassword);
        // const { accessToken: token, name: workspaceName } = await this.getWorkspace();
        // const { accessToken: token, adminUser: { rootTopic }  } = await this.getWorkspace({
        //     include : [ Workspace.AssociationAdminUser ]
        // });

        if (this.previous('code')) {
            const previousMqttUsername = `reader/${rootTopic}/${this.previous('code')}`;

            await MqttAcl.destroy({ where: { username: previousMqttUsername } });
            await MqttUser.destroy({ where: { username: previousMqttUsername } });
        }
        // const mqttUsername = `reader/${rootTopic}/${this.code}`;
        // const mqttPasswordHash = createHash(token);

        const mqttUser = await MqttUser.create({
            username : mqttUsername,
            password : mqttPasswordHash
        });

        await MqttAcl.bulkCreate([
            {
                allow    : '1',
                ipaddr   : null,
                username : mqttUser.username,
                clientid : null,
                access   : 3,
                topic    : `${rootTopic}/sweet-home/${this.code}/#`
            },
            {
                allow    : '1',
                ipaddr   : null,
                username : mqttUser.username,
                clientid : null,
                access   : 3,
                topic    : `${rootTopic}/errors/sweet-home/${this.code}/#`
            }
        ]);
    }
    async open() {
        await new Promise(async (resolve, reject) => {
            const { rootTopic } = await AdminUser.findOne({ where: { workspaceId: this.workspaceId } });

            const clear = () => {
                clearTimeout(timeout);
                mqttTransport.off('message', onMessage);
            };

            // eslint-disable-next-line prefer-const
            let timeout = setTimeout(() => {
                clear();
                reject(new TimeoutError());
            }, 10000);

            const onMessage = (topic, message) => {
                if (topic === `${rootTopic}/sweet-home/${this.code}/d/s` && message.toString() === 'true') {
                    clear();
                    resolve();
                } else if (topic === `${rootTopic}/errors/sweet-home/${this.code}/d/s`) {
                    try {
                        const error = JSON.parse(message.toString());

                        // custom error from firmware
                        reject(new OpenDoorError(error));
                    } catch (e) {
                        reject(new OpenDoorError('Something went wrong'));
                    }
                    clear();
                    resolve();
                }
            };

            mqttTransport.publish(`${rootTopic}/sweet-home/${this.code}/d/s/set`, 'true', { retain: false });
            mqttTransport.on('message', onMessage);
        });
    }

    static async changeBrokerStateStatus({ loginHash, code, brokerStateStatus }) {
        let statusToSave = brokerStateStatus;

        if (statusToSave !== this.BROKER_STATE_READY) statusToSave = this.BROKER_STATE_DISCONNECTED;

        const user = await AdminUser.findOne({
            where : sequelize.where(sequelize.fn('SHA2', sequelize.col('login'), 256), loginHash)
        });

        if (!user) throw new Error('admin user not found');

        const accessTokenReader = await AccessTokenReader.findOne({
            where : { code, workspaceId: user.workspaceId }
        });

        if (!accessTokenReader) throw new Error('accessTokenReader not found');

        await accessTokenReader.update({
            brokerStateStatus : statusToSave
        }, {
            silent : true
        });
    }

    async openWithToken(token) {
        await new Promise(async (resolve, reject) => {
            const { rootTopic } = await AdminUser.findOne({ where: { workspaceId: this.workspaceId } });

            const clear = () => {
                clearTimeout(timeout);
                mqttTransport.off('message', onMessage);
            };

            // eslint-disable-next-line prefer-const
            let timeout = setTimeout(() => {
                clear();
                reject(new TimeoutError());
            }, 10000);

            const onMessage = (topic, message) => {
                if (topic === `${rootTopic}/sweet-home/${this.code}/d/k` && message.toString() === token) {
                    clear();
                    resolve();
                } else if (topic === `${rootTopic}/errors/sweet-home/${this.code}/d/k`) {
                    try {
                        const error = JSON.parse(message.toString());

                        // custom error from firmware
                        reject(new OpenDoorError(error));
                    } catch (e) {
                        reject(new OpenDoorError('Something went wrong'));
                    }
                    clear();
                    resolve();
                }
            };

            mqttTransport.publish(`${rootTopic}/sweet-home/${this.code}/d/k/set`, token, { retain: false });
            mqttTransport.on('message', onMessage);
        });
    }
}

AccessTokenReader.init({
    id                : { type: DT.BIGINT, primaryKey: true, autoIncrement: true },
    // eslint-disable-next-line max-len
    workspaceId       : { type: DT.BIGINT, allowNull: false, defaultValue: () => AccessTokenReader.getWorkspaceIdFromNamespace() },
    name              : { type: DT.STRING, allowNull: false },
    enabled           : { type: DT.BOOLEAN, allowNull: false, defaultValue: true },
    isArchived        : { type: DT.BOOLEAN, allowNull: false, defaultValue: false },
    code              : { type: DT.STRING, allowNull: false },
    phone             : { type: DT.STRING, allowNull: true },
    stateStatus       : { type: DT.STRING, allowNull: false, defaultValue: AccessTokenReader.STATE_INACTIVE },
    brokerStateStatus : { type: DT.STRING, allowNull: true, defaultValue: null },
    popularityCoef    : { type: DT.INTEGER, allowNull: false, defaultValue: 0 },
    activeAt          : { type: DT.DATE(3), allowNull: true },
    createdAt         : { type: DT.DATE(3) },
    updatedAt         : { type: DT.DATE(3) },
    deletedAt         : { type: DT.DELETED_AT_DATE(3), allowNull: false, defaultValue: { [sequelize.Op.eq]: sequelize.literal('0') } },
    resetRules        : { type: DT.BOOLEAN, allowNull: false, defaultValue: true }
}, {
    paranoid   : true,
    timestamps : true,
    deletedAt  : 'deletedAt',
    createdAt  : false,
    hooks      : {
        async beforeUpdate(model) {
            if (model.changed('enabled') && model.isArchived) throw new Error('Cannot enable archived entity');
            if (model.changed('isArchived') && model.isArchived) model.enabled = false;
            if (model.changed('code')) await model.hanldeCodeChanged();

            // clear activeAt
            // if ((model.changed('enabled') || model.changed('isArchived')) && model.enabled && !model.isArchived) {
            //    model.activeAt = null;
            // }
            // check if reader became ->inactive and change state
            // because we want to use athomic operations
            // and as reader can become inactive only after changes fields enabled=false or isArchived=true
            // (so reader-> inactive only due other operations)
            // see tokenReaderManager for other status changes
            // if ((!model.enabled || model.isArchived) && model.stateStatus !== AccessTokenReader.STATE_INACTIVE) {
            //     model.stateStatus = AccessTokenReader.STATE_INACTIVE;
            // }
        },
        async beforeCreate(model) {
            if (model.enabled && model.isArchived) throw new Error('Cannot enable archived entity');
            if (model.changed('code')) await model.hanldeCodeChanged();
        },
        async beforeSave(model, options) {
            // add or remove token accesses when change "enabled" property of token reader
            // and this instance is not newly created
            if (model.changed('enabled') && model.previous('enabled') !== undefined) {
                await model.updateReaderTokens(options,
                    { actionType: model.enabled ? ACTION_TYPES.ADD_ACCESS : ACTION_TYPES.REMOVE_ACCESS });
            }

            // remove access only when set "isArchived" to true(when archive the subject)
            // and don't add access when set "isArchived" to false(when show the access setting), because
            // token reader after showing is always disabled and this instance is not newly created
            if (model.changed('isArchived') && model.isArchived === true) {
                await model.updateReaderTokens(options, { actionType: ACTION_TYPES.REMOVE_ACCESS });
            }
        },
        async beforeDestroy(model, options) {
            const { username: mqttUsername } = await model.getMqttCredentials();

            await MqttAcl.destroy({ where: { username: mqttUsername } });
            await MqttUser.destroy({ where: { username: mqttUsername } });
            await CameraToReaderMap.destroy({
                where       : { accessTokenReaderId: model.id },
                transaction : options.transaction
            });
            await AccessTokenToReaderChangesMap.destroy({
                where       : { accessTokenReaderId: model.id },
                transaction : options.transaction
            });
        }
    },
    scopes : {
        ids(ids) {
            if (ids) {
                return {
                    where : { id: ids }
                };
            }

            return {};
        },
        search(search) {
            if (search) {
                return {
                    where : {
                        [Op.or] : [
                            {
                                code : {
                                    [Op.like] : `%${search}%`
                                }
                            },
                            {
                                name : {
                                    [Op.like] : `%${search}%`
                                }
                            }
                        ]
                    }
                };
            }

            return {};
        },
        enabled(enabled) {
            if (typeof enabled === 'boolean') {
                return {
                    where : { enabled }
                };
            }

            return {};
        },
        isArchived(isArchived) {
            if (typeof isArchived === 'boolean') {
                return {
                    where : { isArchived }
                };
            }

            return {};
        },
        updateDates({ updateStart, updateEnd }) {
            if (updateStart && updateEnd) {
                return {
                    where : {
                        updatedAt : {
                            [Op.gte] : updateStart,
                            [Op.lte] : updateEnd
                        }
                    }
                };
            }

            return {};
        },
        createDates({ createStart, createEnd }) {
            if (createStart && createEnd) {
                return {
                    where : {
                        createdAt : {
                            [Op.gte] : createStart,
                            [Op.lte] : createEnd
                        }
                    }
                };
            }

            return {};
        },
        stateStatus(stateStatus) {
            if (stateStatus) {
                return {
                    where : { stateStatus }
                };
            }

            return {};
        },
        connectionStatus(connectionStatus) {
            if (!connectionStatus) return {};

            const matchedStatuses = AccessTokenReader.connectionStatusesMap.filter(s => s.title === connectionStatus);
            const whereClause = {
                stateStatus : matchedStatuses.map(s => s.stateStatus)
            };

            if (matchedStatuses.some(s => s.brokerStateStatus === null)) {
                whereClause[Op.or] = [ // to avoid `where in (null)`
                    { brokerStateStatus : matchedStatuses
                        .filter(s => !!s.brokerStateStatus)
                        .map(s => s.brokerStateStatus) },
                    { brokerStateStatus: null }
                ];
            } else {
                whereClause.brokerStateStatus = matchedStatuses.map(s => s.brokerStateStatus);
            }

            return {
                where : whereClause
            };
        },
        accessReadersGroupIds(accessReadersGroupIds = []) {
            if (accessReadersGroupIds && accessReadersGroupIds.length) {
                return {
                    where : {
                        '$accessReadersGroups.id$' : accessReadersGroupIds
                    }
                };
            }

            return {};
        }
    },
    sequelize
});

export default AccessTokenReader;
