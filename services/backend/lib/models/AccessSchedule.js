/* eslint-disable no-param-reassign */
import { DataTypes as DT, Op } from 'sequelize';
import _Uniq from 'lodash/uniq';
import sequelize from '../sequelizeSingleton';
import { ACTION_TYPES } from '../constants/accessTokenToReaderChangesMap.js';
import { numberToBitArray } from '../services/utils/dumps';
import Base from './WorkspaceModelBase';
import AccessSetting from './AccessSetting';
import AccessReadersGroup from './AccessReadersGroup';
import AccessSubject from './AccessSubject';
import AccessTokenToReaderChangesMap from './AccessTokenToReaderChangesMap';
import SettingToScheduleMap from './mappings/SettingToScheduleMap';
import AccessScheduleDate from './AccessScheduleDate';

function date2minutes(date) {
    return Math.floor(date / 1000 / 60);
}

function accessScheduleDateToStringRule({
    id,
    from,
    to,
    weekBitMask,
    monthBitMask,
    dailyIntervalStart,
    dailyIntervalEnd
}) {
    if (
        from &&
        to &&
        weekBitMask === null &&
        monthBitMask === null &&
        dailyIntervalStart === null &&
        dailyIntervalEnd === null
    ) {
        // 1 правило - с и до
        return `1_${date2minutes(from)}_${date2minutes(to)}`;
    } else if (
        !from &&
        !to &&
        weekBitMask !== null &&
        monthBitMask === null &&
        dailyIntervalStart !== null &&
        dailyIntervalEnd !== null
    ) {
        // проверить если мы имеем дело с 9 правилом
        if (dailyIntervalStart < 60000 && dailyIntervalEnd >= 86340000 && weekBitMask === 127) return '9_1';

        // маска дней недели
        return `3_${date2minutes(dailyIntervalStart)}_${date2minutes(dailyIntervalEnd)}_${numberToBitArray(
            weekBitMask,
            7
        ).join('')}`;
    } else if (
        from &&
        to &&
        weekBitMask !== null &&
        monthBitMask === null &&
        dailyIntervalStart !== null &&
        dailyIntervalEnd !== null
    ) {
        // маска дней недели + с и до
        return `7_${date2minutes(dailyIntervalStart)}_${date2minutes(dailyIntervalEnd)}_${numberToBitArray(
            weekBitMask,
            7
        ).join('')}_${date2minutes(from)}_${date2minutes(to)}`;
    }

    console.warn(
        `AccessTokensSync. Unsupported rule format(${JSON.stringify({
            id,
            from,
            to,
            weekBitMask,
            monthBitMask,
            dailyIntervalStart,
            dailyIntervalEnd
        })}). Skip.`
    );

    return null;
}
class AccessSchedule extends Base {
    static initRelations() {
        super.initRelations();
        this.AssociationAccessSettings = this.belongsToMany(AccessSetting, {
            through    : SettingToScheduleMap,
            as         : 'accessSettings',
            foreignKey : 'accessScheduleId',
            otherKey   : 'accessSettingId'
        });
        this.AssociationSettingToScheduleMap = this.hasMany(SettingToScheduleMap, {
            as         : 'settingToScheduleMap',
            foreignKey : 'accessScheduleId'
        });

        this.AssociationAccessScheduleDates = this.hasMany(AccessScheduleDate, {
            as         : 'accessScheduleDates',
            foreignKey : 'scheduleId'
        });
    }
    async updateReaderTokens(options, { actionType } = {}) {
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
                    include     : [
                        {
                            association : AccessReadersGroup.AssociationAccessTokenReaders,
                            attributes  : [ 'id' ],
                            required    : false
                        }
                    ],
                    attributes : [ 'id' ],
                    required   : false
                },
                {
                    association : AccessSetting.AssociationAccessSubjects,
                    include     : [
                        {
                            association : AccessSubject.AssociationAccessSubjectTokens,
                            attributes  : [ 'id', 'code' ],
                            required    : false
                        }
                    ],
                    attributes : [ 'id', 'mobileEnabled', 'virtualCode', 'phoneEnabled', 'phoneToken' ],
                    required   : false
                }
            ]
        });

        // create a changes within one setting
        for (const setting of accessSettings) {
            const accessTokenReaderIds = _Uniq([
                ...setting.accessTokenReaders.map(({ id }) => id),
                ...setting.accessReadersGroups
                    .map(({ accessTokenReaders }) => {
                        return accessTokenReaders.map(({ id }) => id);
                    })
                    .flat()
            ]);
            const accessSubjectTokenCodes = _Uniq([
                ...setting.accessSubjects
                    .map(({ accessSubjectTokens }) => {
                        return accessSubjectTokens.map(({ code }) => code);
                    })
                    .flat(),
                ...setting.accessSubjects
                    .filter(({ mobileEnabled }) => mobileEnabled)
                    .map(({ mobileToken }) => mobileToken),
                ...setting.accessSubjects.filter(({ phoneEnabled }) => phoneEnabled).map(({ phoneToken }) => phoneToken)
            ]);

            await AccessTokenToReaderChangesMap.addUpdates(
                {
                    accessTokenReaderIds,
                    accessSubjectTokenCodes,
                    actionType
                },
                options
            );
        }
    }

    static async findAllByParams({ ids, limit, offset, sortedBy, order, ...filters }, options = {}) {
        const filterScopes = [
            { method: [ 'ids', ids ] },
            { method: [ 'search', filters.search ] },
            { method: [ 'enabled', filters.enabled ] },
            { method: [ 'isArchived', filters.isArchived ] },
            { method: [ 'periodicity', filters.periodicity ] },
            {
                method : [
                    'updateDates',
                    {
                        updateStart : filters.updateStart,
                        updateEnd   : filters.updateEnd
                    }
                ]
            },
            {
                method : [
                    'createDates',
                    {
                        createStart : filters.createStart,
                        createEnd   : filters.createEnd
                    }
                ]
            }
        ];

        const { rows: accessSchedules, count } = await AccessSchedule.scope(filterScopes).findAndCountAll({
            ...options,
            ...(ids ? {} : { limit, offset }),
            include : [
                {
                    association : AccessSchedule.AssociationAccessScheduleDates,
                    required    : false
                }
            ],
            order : [
                [ sortedBy, order ],
                [ 'id', 'ASC' ]
            ],
            subQuery : false,
            distinct : true
        });

        return { accessSchedules, count };
    }

    async getDatesStringRules(options) {
        // refresh current instance to retrieve actual schedule dates
        await this.reload({
            ...options,
            include : [
                {
                    association : AccessSchedule.AssociationAccessScheduleDates,
                    required    : true
                }
            ]
        });

        const rules = this.accessScheduleDates.map(accessScheduleDateToStringRule).filter((x) => x);

        return rules;
    }
}
AccessSchedule.init(
    {
        id          : { type: DT.BIGINT, primaryKey: true, autoIncrement: true },
        // eslint-disable-next-line max-len
        workspaceId : {
            type         : DT.BIGINT,
            allowNull    : false,
            defaultValue : () => AccessSchedule.getWorkspaceIdFromNamespace()
        },
        name           : { type: DT.STRING, allowNull: false },
        enabled        : { type: DT.BOOLEAN, allowNull: false, defaultValue: true },
        isArchived     : { type: DT.BOOLEAN, allowNull: false, defaultValue: false },
        popularityCoef : { type: DT.INTEGER, allowNull: false, defaultValue: 0 },
        createdAt      : { type: DT.DATE(3) },
        updatedAt      : { type: DT.DATE(3) },
        deletedAt      : {
            type         : DT.DELETED_AT_DATE(3),
            allowNull    : false,
            defaultValue : { [sequelize.Op.eq]: sequelize.literal('0') }
        }
    },
    {
        paranoid   : true,
        timestamps : true,
        deletedAt  : 'deletedAt',
        createdAt  : false,
        updatedAt  : false,
        hooks      : {
            beforeUpdate : (model) => {
                if (model.changed('enabled') && model.isArchived) throw new Error('Cannot enable archived entity');
                if (model.changed('isArchived') && model.isArchived) model.enabled = false;
            },
            beforeCreate : (model) => {
                if (model.enabled && model.isArchived) throw new Error('Cannot enable archived entity');
            },
            beforeSave : async (model, options) => {
                // add or remove token accesses when change "enabled" property of schedule
                // and this instance is not newly created
                if (model.changed('enabled') && model.previous('enabled') !== undefined) {
                    await model.updateReaderTokens(options, {
                        actionType : model.enabled ? ACTION_TYPES.ADD_ACCESS : ACTION_TYPES.UPDATE_ACCESS
                    });
                }

                // remove access only when set "isArchived" to true(when archive the subject)
                // and don't add access when set "isArchived" to false(when show the access setting), because
                // schedule after showing is always disabled and this instance is not newly created
                if (model.changed('isArchived') && model.isArchived === true) {
                    await model.updateReaderTokens(options, { actionType: ACTION_TYPES.UPDATE_ACCESS });
                }
            },
            beforeDestroy : async (model, options) => {
                await model.updateReaderTokens(options, { actionType: ACTION_TYPES.REMOVE_ACCESS });
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
                            name : {
                                [Op.like] : `%${search}%`
                            }
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
            isArchived(isArchived) {
                if (typeof isArchived === 'boolean') {
                    return {
                        where : { isArchived }
                    };
                }

                return {};
            },
            periodicity(periodicity) {
                if (periodicity === 'PERIODIC') {
                    return {
                        where : {
                            [Op.or] : {
                                '$accessScheduleDates.weekBitMask$'  : { [Op.not]: null },
                                '$accessScheduleDates.monthBitMask$' : { [Op.not]: null }
                            }
                        }
                    };
                } else if (periodicity === 'NOT_PERIODIC') {
                    return {
                        where : {
                            '$accessScheduleDates.weekBitMask$'  : null,
                            '$accessScheduleDates.monthBitMask$' : null
                        }
                    };
                }

                return {};
            }
        },
        sequelize
    }
);

export default AccessSchedule;
