/* eslint-disable no-param-reassign */
import path                    from 'path';
import { DataTypes as DT, Op, VIRTUAL } from 'sequelize';
import uuidv4                  from 'uuid/v4';
import fse                     from 'fs-extra';
import _Flatten from 'lodash/flatten';
import _Uniq from 'lodash/uniq';
// import modifyExif from 'modify-exif';
// import Jimp from 'jimp';
import { customAlphabet } from 'nanoid';
import { staticPath }      from '../config';
import sequelize               from '../sequelizeSingleton';
import { ACTION_TYPES }        from '../constants/accessTokenToReaderChangesMap.js';
import Base                    from './WorkspaceModelBase';
import AccessSetting           from './AccessSetting';
import SettingToSubjectMap     from './mappings/SettingToSubjectMap';
import AccessSubjectToken      from './AccessSubjectToken';
import AccessReadersGroup from './AccessReadersGroup';
import AccessTokenToReaderChangesMap from './AccessTokenToReaderChangesMap';
import User from './User';
// import MqttUser from './MqttUser';
// import MqttAcl from './MqttAcl';
// import { createHash } from './utils';

export const VIRTUAL_CODE_PREFIXES = {
    SBJ : 'sbj',
    PHN : 'phn'
};

class AccessSubject extends Base {
    static initRelations() {
        super.initRelations();
        this.AssociationAccessSettings = this.belongsToMany(AccessSetting, { through: SettingToSubjectMap, as: 'accessSettings', foreignKey: 'accessSubjectId', otherKey: 'accessSettingId' });
        this.AssociationSettingToSubjectMap = this.hasMany(SettingToSubjectMap, { as: 'settingToSubjectMap', foreignKey: 'accessSubjectId' });

        this.AssociationAccessSubjectTokens = this.hasMany(AccessSubjectToken, { as: 'accessSubjectTokens', foreignKey: 'accessSubjectId' });
    }

    async setAvatarImage(file, options) {
        if (this.avatar) await this.deleteAvatarImage(options);

        const ext = path.extname(file.originalname).toLowerCase();
        const filename = `${uuidv4() + ext}`;

        await this.update({ avatar: filename }, options);

        // let buffer = file.buffer;

        // console.log({ext});
        // if (ext === '.jpeg' || ext === '.jpg') {
        //     let imageOrientation;

        //     buffer = modifyExif(file.buffer, data => {
        //         imageOrientation = data && data['0th'] && data['0th']['274'] || false;
        //         console.log(data);
        //         data.Exif = {};
        //         data['0th'] = {};
        //         data.GPS = {};
        //     });

        //     if (imageOrientation) {
        //         const image = await Jimp.read(buffer);

        //         if (imageOrientation === 3) image.rotate(180);
        //         else if (imageOrientation === 6) image.rotate(270);
        //         else if (imageOrientation === 8) image.rotate(90);

        //         buffer = await image.getBufferAsync(Jimp.MIME_JPEG);
        //     }
        // }

        await fse.writeFile(`${staticPath}/access-subjects/${filename}`, file.buffer);
    }

    async deleteAvatarImage(options) {
        if (!this.avatar) return;

        try {
            await fse.unlink(`${staticPath}/access-subjects/${this.avatar}`);
        } catch (e) {
            if (e.code !== 'ENOENT') throw e; // case if file doesnt exist
        }
        await this.update({ avatar: null }, options);
    }

    async getAssociatedEntitiesData(options) {
        const accessSettings = await this.getAccessSettings({
            ...options,
            attributes : [ 'id' ],
            include    : [
                {
                    association : AccessSetting.AssociationAccessTokenReaders,
                    attributes  : [ 'id' ],
                    required    : false
                },
                {
                    association : AccessSetting.AssociationAccessReadersGroups,
                    include     : [ {
                        association : AccessReadersGroup.AssociationAccessTokenReaders,
                        attributes  : [ 'id' ],
                        required    : false
                    } ],
                    attributes : [ 'id' ],
                    required   : false
                }
            ]
        });

        const accessTokenReaderIds = _Uniq([
            ..._Flatten(accessSettings.map(accessSetting => {
                return [
                    ...accessSetting.accessTokenReaders.map(({ id }) => id),
                    ..._Flatten(accessSetting.accessReadersGroups.map(({ accessTokenReaders }) => {
                        return accessTokenReaders.map(({ id }) => id);
                    }))
                ];
            }))
        ]);
        const accessSubjectTokenCodes = _Uniq(await this.getAccessSubjectTokens(options).map(({ code }) => code));

        if (this.mobileEnabled) accessSubjectTokenCodes.push(this.mobileToken);
        if (this.phoneEnabled) accessSubjectTokenCodes.push(this.phoneToken);

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
            { method: [ 'mobileEnabled', filters.mobileEnabled ] },
            { method: [ 'isArchived', filters.isArchived ] },
            { method: [ 'accessSubjectTokenId', filters.accessSubjectTokenId ] },
            { method : [ 'updateDates', {
                updateStart : filters.updateStart,
                updateEnd   : filters.updateEnd
            } ] },
            { method : [ 'createDates', {
                createStart : filters.createStart,
                createEnd   : filters.createEnd
            } ] }
        ];

        const { rows, count } = await AccessSubject.scope(filterScopes).findAndCountAll({
            ...options,
            ...(ids) ? {} : { limit, offset },
            include : [
                {
                    association : AccessSubject.AssociationAccessSubjectTokens,
                    attributes  : [],
                    required    : false
                }
            ],
            group      : [ 'AccessSubject.id' ],
            attributes : [ 'id' ],
            order      : [ [ sortedBy, order ], [ 'id', 'ASC' ] ],
            subQuery   : false,
            distinct   : true
        });

        const accessSubjects = rows.length ? await AccessSubject.findAll({
            where : {
                id : rows.map(({ id }) => id)
            },
            include : [ { association: AccessSubject.AssociationAccessSubjectTokens, required: false } ],
            order   : [ [ sortedBy, order ], [ 'id', 'ASC' ] ]
        }) : [];

        return { accessSubjects, count: count && count.length || 0 };
    }
}
AccessSubject.init({
    id               : { type: DT.BIGINT, primaryKey: true, autoIncrement: true },
    // eslint-disable-next-line max-len
    workspaceId      : { type: DT.BIGINT, allowNull: false, defaultValue: () => AccessSubject.getWorkspaceIdFromNamespace() },
    userId           : { type: DT.BIGINT, allowNull: true },
    name             : { type: DT.STRING, allowNull: false, unique: true },
    enabled          : { type: DT.BOOLEAN, allowNull: false, defaultValue: true },
    isArchived       : { type: DT.BOOLEAN, allowNull: false, defaultValue: false },
    isInvited        : { type: DT.BOOLEAN, allowNull: false, defaultValue: false },
    mobileEnabled    : { type: DT.BOOLEAN, allowNull: false, defaultValue: false },
    position         : { type: DT.STRING, allowNull: true },
    email            : { type: DT.STRING, allowNull: true, unique: true },
    phone            : { type: DT.STRING, allowNull: true },
    phoneEnabled     : { type: DT.BOOLEAN, allowNull: false, defaultValue: false },
    avatar           : { type: DT.STRING, allowNull: true },
    avatarColor      : { type: DT.STRING, allowNull: true },
    popularityCoef   : { type: DT.INTEGER, allowNull: false, defaultValue: 0 },
    createdAt        : { type: DT.DATE(3) },
    updatedAt        : { type: DT.DATE(3) },
    showReaderGroups : { type: DT.BOOLEAN, allowNull: false, defaultValue: false },
    deletedAt        : { type: DT.DELETED_AT_DATE(3), allowNull: false, defaultValue: { [sequelize.Op.eq]: sequelize.literal('0') } }, // defaultValue here is used only in where clausure by sequelize, it seems to be the sequelize bug
    virtualCode      : { type: DT.STRING(12), allowNull: false, defaultValue: customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 12) },
    mobileToken      : {
        type : VIRTUAL,
        get() {
            return `${VIRTUAL_CODE_PREFIXES.SBJ}-${this.virtualCode}`;
        }
    },
    phoneToken : {
        type : VIRTUAL,
        get() {
            return `${VIRTUAL_CODE_PREFIXES.PHN}-${this.virtualCode}`;
        }
    },
    canAttachTokens : { type: DT.BOOLEAN, allowNull: false, defaultValue: false }
}, {
    paranoid   : true,
    timestamps : true,
    deletedAt  : 'deletedAt',
    createdAt  : false,
    updatedAt  : false,
    hooks      : {
        beforeUpdate : async (model) => {
            if (model.changed('enabled') && model.isArchived) throw new Error('Cannot enable archived entity');
            if (model.changed('isArchived') && model.isArchived) model.enabled = false;
        },
        beforeCreate : async (model) => {
            if (model.enabled && model.isArchived) throw new Error('Cannot enable archived entity');
        },
        beforeSave : async (model, options) => {
            if ((model.changed('email')) && model.userId) {
                await model.set({ userId: null });
            }
            if (!model.email) model.email = null;
            if (model.mobileEnabled && !model.email) throw new Error('Cannot enable mobile without email');

            // add or remove token accesses when change "enabled" property of subject
            // and this instance is not newly created
            if (model.changed('enabled') && model.previous('enabled') !== undefined) {
                await model.updateReaderTokens(options,
                    { actionType: model.enabled ? ACTION_TYPES.ADD_ACCESS : ACTION_TYPES.REMOVE_ACCESS });
            }

            // remove access only when set "isArchived" to true(when archive the subject)
            // and don't add access when set "isArchived" to false(when show the access setting), because
            // subject after showing is always disabled and this instance is not newly created
            if (model.changed('isArchived') && model.isArchived === true) {
                await model.updateReaderTokens(options, { actionType: ACTION_TYPES.REMOVE_ACCESS });
            }

            if (model.enabled && model.changed('mobileEnabled') && model.previous('mobileEnabled') !== undefined) {
                const { accessTokenReaderIds } = await model.getAssociatedEntitiesData(options);
                // current changes related only to mobile token access
                const accessSubjectTokenCodes = [ model.mobileToken ];

                await AccessTokenToReaderChangesMap.addUpdates(
                    {
                        accessTokenReaderIds,
                        accessSubjectTokenCodes,
                        actionType : model.mobileEnabled ? ACTION_TYPES.ADD_ACCESS : ACTION_TYPES.REMOVE_ACCESS
                    },
                    options
                );
            }
            if (model.enabled && model.changed('phoneEnabled') && model.previous('phoneEnabled') !== undefined) {
                const { accessTokenReaderIds } = await model.getAssociatedEntitiesData(options);
                // current changes related only to phone call token access
                const accessSubjectTokenCodes = [ model.phoneToken ];

                await AccessTokenToReaderChangesMap.addUpdates(
                    {
                        accessTokenReaderIds,
                        accessSubjectTokenCodes,
                        actionType : model.phoneEnabled ? ACTION_TYPES.ADD_ACCESS : ACTION_TYPES.REMOVE_ACCESS
                    },
                    options
                );
            }
        },
        afterSave : async (model) => {
            if (model.changed('userId')) {
                const previousUserId = model.previous('userId');

                if (previousUserId) {
                    const user = await User.findOne({
                        where    : { id: previousUserId },
                        include  : [ User.AssociationWorkspace ],
                        paranoid : false
                    });

                    await user.destroy();
                }
            }
            if (model.changed('mobileEnabled') && !model.mobileEnabled && model.userId) {
                const user = await User.findOne({
                    where    : { id: model.userId },
                    include  : [ User.AssociationWorkspace ],
                    paranoid : false
                });

                await user.hanldeCredentialsChanged();
            }
        },
        beforeDestroy : async (model, options) => {
            await model.updateReaderTokens(options, { actionType: ACTION_TYPES.REMOVE_ACCESS });
            await model.setAccessSubjectTokens([], { ...options, individualHooks: true });
            await model.update({ userId: null }, options);
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
                                name : {
                                    [Op.like] : `%${search}%`
                                }
                            },
                            {
                                '$accessSubjectTokens.name$' : {
                                    [Op.like] : `%${search}%`
                                }
                            }
                        ]
                    }
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
        enabled(enabled) {
            if (typeof enabled === 'boolean') {
                return {
                    where : { enabled }
                };
            }

            return {};
        },
        mobileEnabled(mobileEnabled) {
            if (typeof mobileEnabled === 'boolean') {
                return {
                    where : { mobileEnabled }
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
        accessSubjectTokenId(accessSubjectTokenId) {
            if (accessSubjectTokenId) {
                return {
                    where : {
                        '$accessSubjectTokens.id$' : accessSubjectTokenId
                    }
                };
            }

            return {};
        }
    },
    sequelize
});

export default AccessSubject;
