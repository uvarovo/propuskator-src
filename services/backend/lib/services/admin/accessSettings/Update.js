/* eslint-disable no-shadow */
import ChistaException from 'chista/Exception';
import _Difference from 'lodash/difference';

import Base from '../../Base';
import AccessSetting from '../../../models/AccessSetting';
import AccessTokenToReaderChangesMap from '../../../models/AccessTokenToReaderChangesMap.js';
import { ACTION_TYPES } from '../../../constants/accessTokenToReaderChangesMap.js';
import { dumpAccessSetting } from '../../utils/dumps';
import sequelize from '../../../sequelizeSingleton';
import AccessSchedule from '../../../models/AccessSchedule';
import DX from '../../../models/utils/DX';
import { BadRequestError, NotFoundError } from '../../utils/SX';

export default class AccessSettingUpdate extends Base {
    static validationRules = {
        id                    : [ 'required', 'db_id' ],
        accessSubjectIds      : [ 'list_items_unique', { 'list_of': [ 'db_id' ] }, 'fixed_not_empty_list', 'filter_empty_values' ],
        accessScheduleIds     : [ 'list_items_unique', { 'list_of': [ 'db_id' ] }, 'fixed_not_empty_list', 'filter_empty_values' ],
        accessTokenReaderIds  : [ 'list_items_unique', { 'list_of': [ 'db_id' ] }, 'filter_empty_values' ],
        accessReadersGroupIds : [ 'list_items_unique', { 'list_of': [ 'db_id' ] }, 'filter_empty_values' ],
        enabled               : [ 'boolean' ],
        isArchived            : [ 'boolean' ]
    };

    async execute({ id, accessReadersGroupIds, accessTokenReaderIds, accessScheduleIds, accessSubjectIds, ...data }) {
        try {
            let accessSetting = null;

            await sequelize.transaction(async (transaction) => {
                accessSetting = await AccessSetting.findByPkOrFail(id, { transaction });
                // accessSetting.changed('updatedAt', true);
                accessSetting.set({ ...data, updatedAt: sequelize.fn('CURRENT_TIMESTAMP', 3) });
                await accessSetting.save({ transaction });

                // setting's associated entities before updating. Retrieve it to compare after updating
                // and handle new changes(write new changes to accesstokentoreaderchangesmap table)
                const oldAssociatedEntitiesData = accessSetting.enabled
                    ? await accessSetting.getAssociatedEntitiesData({ transaction })
                    : null;

                if (accessReadersGroupIds) {
                    await accessSetting.setAccessReadersGroups(accessReadersGroupIds, { transaction });
                }
                if (accessTokenReaderIds) {
                    await accessSetting.setAccessTokenReaders(accessTokenReaderIds, { transaction });
                }
                if (accessScheduleIds) {
                    await accessSetting.setAccessSchedules(accessScheduleIds, { transaction });
                }
                if (accessSubjectIds) {
                    await accessSetting.setAccessSubjects(accessSubjectIds, { transaction });
                }

                let newAssociatedEntitiesData = null;

                if (accessSetting.enabled) {
                    // setting's associated entities after updating
                    newAssociatedEntitiesData = await accessSetting.getAssociatedEntitiesData({ transaction });

                    const removedReadersIds = _Difference(
                        oldAssociatedEntitiesData.accessTokenReaderIds,
                        newAssociatedEntitiesData.accessTokenReaderIds
                    );
                    const removedSubjectTokenCodes = _Difference(
                        oldAssociatedEntitiesData.accessSubjectTokenCodes,
                        newAssociatedEntitiesData.accessSubjectTokenCodes
                    );
                    const addedReadersIds = _Difference(
                        newAssociatedEntitiesData.accessTokenReaderIds,
                        oldAssociatedEntitiesData.accessTokenReaderIds
                    );
                    const addedSubjectTokenCodes = _Difference(
                        newAssociatedEntitiesData.accessSubjectTokenCodes,
                        oldAssociatedEntitiesData.accessSubjectTokenCodes
                    );

                    if (removedReadersIds.length) {
                        await AccessTokenToReaderChangesMap.addUpdates(
                            {
                                accessTokenReaderIds    : removedReadersIds,
                                accessSubjectTokenCodes : oldAssociatedEntitiesData.accessSubjectTokenCodes,
                                actionType              : ACTION_TYPES.REMOVE_ACCESS
                            },
                            { transaction }
                        );
                    }
                    if (removedSubjectTokenCodes.length) {
                        await AccessTokenToReaderChangesMap.addUpdates(
                            {
                                accessTokenReaderIds    : oldAssociatedEntitiesData.accessTokenReaderIds,
                                accessSubjectTokenCodes : removedSubjectTokenCodes,
                                actionType              : ACTION_TYPES.REMOVE_ACCESS
                            },
                            { transaction }
                        );
                    }
                    if (addedReadersIds.length) {
                        await AccessTokenToReaderChangesMap.addUpdates(
                            {
                                accessTokenReaderIds    : addedReadersIds,
                                accessSubjectTokenCodes : newAssociatedEntitiesData.accessSubjectTokenCodes,
                                actionType              : ACTION_TYPES.ADD_ACCESS
                            },
                            { transaction }
                        );
                    }
                    if (addedSubjectTokenCodes.length) {
                        await AccessTokenToReaderChangesMap.addUpdates(
                            {
                                accessTokenReaderIds    : newAssociatedEntitiesData.accessTokenReaderIds,
                                accessSubjectTokenCodes : addedSubjectTokenCodes,
                                actionType              : ACTION_TYPES.ADD_ACCESS
                            },
                            { transaction }
                        );
                    }
                }

                // reload current instance to retrieve actual associated entities for handling
                // schedules changes below and for the service response
                await accessSetting.reload({
                    include : [
                        {
                            association : AccessSetting.AssociationAccessReadersGroups,
                            required    : false
                        },
                        {
                            association : AccessSetting.AssociationAccessTokenReaders,
                            required    : false
                        },
                        {
                            association : AccessSetting.AssociationAccessSchedules,
                            include     : [ AccessSchedule.AssociationAccessScheduleDates ],
                            required    : false
                        },
                        {
                            association : AccessSetting.AssociationAccessSubjects,
                            required    : false
                        }
                    ],
                    transaction
                });

                if (accessSetting.enabled) {
                    const removedSchedulesIds = _Difference(
                        oldAssociatedEntitiesData.accessSchedulesIds,
                        newAssociatedEntitiesData.accessSchedulesIds
                    );
                    const addedSchedulesIds = _Difference(
                        newAssociatedEntitiesData.accessSchedulesIds,
                        oldAssociatedEntitiesData.accessSchedulesIds
                    );

                    // create changes with ADD_ACCESS action type only when add schedules without
                    // removing any, otherwise create changes with UPDATE_ACCESS action type because
                    // there is no way to remove concrete rule from firmware now, so its needed to
                    // remove all rules and then add only actual
                    if (addedSchedulesIds.length && !removedSchedulesIds.length) {
                        const addedSchedules = accessSetting.accessSchedules.filter(({ id }) =>
                            addedSchedulesIds.includes(id)
                        );

                        let rulesToAdd = [];

                        for (const accessSchedule of addedSchedules) {
                            const rules = await accessSchedule.getDatesStringRules();

                            rulesToAdd = [ ...rulesToAdd, ...rules ];
                        }

                        await AccessTokenToReaderChangesMap.addUpdates(
                            {
                                accessTokenReaderIds    : newAssociatedEntitiesData.accessTokenReaderIds,
                                accessSubjectTokenCodes : newAssociatedEntitiesData.accessSubjectTokenCodes,
                                actionType              : ACTION_TYPES.ADD_ACCESS,
                                data                    : { rules: rulesToAdd }
                            },
                            {
                                transaction
                            }
                        );
                    } else if (removedSchedulesIds.length) {
                        await AccessTokenToReaderChangesMap.addUpdates(
                            {
                                accessTokenReaderIds    : newAssociatedEntitiesData.accessTokenReaderIds,
                                accessSubjectTokenCodes : newAssociatedEntitiesData.accessSubjectTokenCodes,
                                actionType              : ACTION_TYPES.UPDATE_ACCESS
                            },
                            {
                                transaction
                            }
                        );
                    }
                }

                if (
                    (accessReadersGroupIds || accessTokenReaderIds) &&
                    !accessSetting.accessReadersGroups.length &&
                    !accessSetting.accessTokenReaders.length
                ) {
                    throw new ChistaException({
                        code   : 'FORMAT_ERROR',
                        fields : { accessTokenReaderIds: 'REQUIRED' }
                    });
                }
            });

            return {
                data : dumpAccessSetting(accessSetting)
            };
        } catch (e) {
            if (e instanceof DX) {
                if (e instanceof DX.ForeignKeyConstraintError) {
                    throw new BadRequestError(BadRequestError.codes.FOREIGN_KEY_CONSTRAINT, {
                        fields    : e.fields,
                        modelName : e.modelName
                    });
                } else if (e instanceof DX.UniqueConstraintError) {
                    throw new BadRequestError(BadRequestError.codes.UNIQUE_CONSTRAINT, {
                        fields    : e.fields,
                        modelName : e.modelName
                    });
                } else if (e instanceof DX.NotFoundError) {
                    throw new NotFoundError(NotFoundError.codes.CANNOT_FIND_MODEL, {
                        modelName  : e.modelName,
                        primaryKey : e.primaryKey
                    });
                } else throw e;
            } else throw e;
        }
    }
}
