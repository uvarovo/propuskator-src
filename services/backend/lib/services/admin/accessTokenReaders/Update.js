import _Difference from 'lodash/difference';

import { tokenReadersManager } from '../../../managers/tokenReadersManager';
import AccessTokenReader from '../../../models/AccessTokenReader';
import AccessTokenToReaderChangesMap from '../../../models/AccessTokenToReaderChangesMap.js';
import { ACTION_TYPES } from '../../../constants/accessTokenToReaderChangesMap';
import Base from '../../Base';
import { dumpAccessTokenReader } from '../../utils/dumps';
import sequelize from '../../../sequelizeSingleton';
import DX from '../../../models/utils/DX';
import { BadRequestError, NotFoundError, ValidationError } from '../../utils/SX';

export default class AccessTokenReaderUpdate extends Base {
    static validationRules = {
        id    : [ 'required', 'db_id' ],
        name  : [ 'string', 'trim', 'not_empty', { 'fixed_max_length': 255 }, { 'fixed_min_length': 1 } ],
        phone : [ 'string', 'trim', 'phone', { 'max_length': 255 } ],
        code  : [
            'string',
            'trim',
            'not_empty',
            { 'fixed_max_length': 255 },
            { 'fixed_min_length': 1 },
            { 'custom_error_code': [ 'WRONG_TOKEN_READER_CODE_FORMAT', 'like', '^[a-zA-Z0-9:\\-_]+$' ] }
        ],
        enabled               : [ 'boolean' ],
        isArchived            : [ 'boolean' ],
        accessReadersGroupIds : [ { 'list_of': 'db_id' } ]
    };

    async execute({ id, accessReadersGroupIds, ...data }) {
        try {
            const dataToUpdate = this._getDataToUpdate(data);

            let accessTokenReader = null;

            await sequelize.transaction(async (transaction) => {
                accessTokenReader = await AccessTokenReader.findByPkOrFail(id, { transaction });

                await accessTokenReader.update(dataToUpdate, { transaction });
                // timestamps do not update by `.update` of model instance
                await AccessTokenReader.update({ updatedAt: Date.now() }, { where: { id }, transaction });

                // retrieve associated data only when reader is enabled, because when reader is disabled
                // it should not receive updates
                const oldAssociatedEntitiesData = accessTokenReader.enabled
                    ? await accessTokenReader.getAssociatedEntitiesData({ transaction })
                    : null;

                await accessTokenReader.save({ transaction });

                // TODO: move logic with setting new relations and calculating and setting changes to model's method
                if (accessReadersGroupIds) {
                    await accessTokenReader.setAccessReadersGroups(accessReadersGroupIds, { transaction });
                }

                // calculate and save changes only when reader is enabled
                if (accessTokenReader.enabled) {
                    const newAssociatedEntitiesData = await accessTokenReader.getAssociatedEntitiesData({
                        transaction
                    });

                    const removedAccessSubjectTokenCodes = _Difference(
                        oldAssociatedEntitiesData.accessSubjectTokenCodes,
                        newAssociatedEntitiesData.accessSubjectTokenCodes
                    );
                    const addedAccessSubjectTokenCodes = _Difference(
                        newAssociatedEntitiesData.accessSubjectTokenCodes,
                        oldAssociatedEntitiesData.accessSubjectTokenCodes
                    );

                    if (removedAccessSubjectTokenCodes.length) {
                        await AccessTokenToReaderChangesMap.addUpdates(
                            {
                                accessTokenReaderIds    : newAssociatedEntitiesData.accessTokenReaderIds,
                                accessSubjectTokenCodes : removedAccessSubjectTokenCodes,
                                actionType              : ACTION_TYPES.REMOVE_ACCESS
                            },
                            { transaction }
                        );
                    }
                    if (addedAccessSubjectTokenCodes.length) {
                        await AccessTokenToReaderChangesMap.addUpdates(
                            {
                                accessTokenReaderIds    : newAssociatedEntitiesData.accessTokenReaderIds,
                                accessSubjectTokenCodes : addedAccessSubjectTokenCodes,
                                actionType              : ACTION_TYPES.ADD_ACCESS
                            },
                            { transaction }
                        );
                    }
                }

                await accessTokenReader.reload({
                    include : [
                        {
                            association : AccessTokenReader.AssociationAccessReadersGroups,
                            required    : false
                        }
                    ],
                    transaction
                });
            });
            tokenReadersManager.syncAccessTokenReader(accessTokenReader);

            return {
                data : dumpAccessTokenReader(accessTokenReader)
            };
        } catch (e) {
            if (e instanceof DX) {
                if (e instanceof DX.ForeignKeyConstraintError) {
                    throw new BadRequestError(BadRequestError.codes.FOREIGN_KEY_CONSTRAINT, {
                        fields    : e.fields,
                        modelName : e.modelName
                    });
                } else if (e instanceof DX.UniqueConstraintError) {
                    if (
                        e.modelName === 'AccessTokenReader' &&
                        Object.keys(e.fields).length === 1 &&
                        Object.keys(e.fields)[0] === 'AccessTokenReaders_workspaceId_name_deletedAt_uk'
                    ) {
                        throw new ValidationError(ValidationError.codes.READER_NAME_IS_USED, { field: 'name' });
                    } else if (
                        e.modelName === 'AccessTokenReader' &&
                        Object.keys(e.fields).length === 1 &&
                        Object.keys(e.fields)[0] === 'AccessTokenReaders_workspaceId_code_deletedAt_uk'
                    ) {
                        throw new ValidationError(ValidationError.codes.READER_CODE_IS_USED, { field: 'code' });
                    } else if (
                        e.modelName === 'AccessTokenReader' &&
                        Object.keys(e.fields).length === 1 &&
                        Object.keys(e.fields)[0] === 'AccessTokenReaders_workspaceId_phone_deletedAt_uk'
                    ) {
                        throw new ValidationError(ValidationError.codes.READER_PHONE_IS_USED, { field: 'phone' });
                    } else if (
                        e.modelName === 'MqttUser' &&
                        Object.keys(e.fields).length === 1 &&
                        Object.keys(e.fields)[0] === 'username'
                    ) {
                        // eslint-disable-next-line more/no-duplicated-chains
                        throw new ValidationError(ValidationError.codes.READER_CODE_IS_USED, { field: 'code' });
                    } else {
                        throw e;
                    }
                } else if (e instanceof DX.NotFoundError) {
                    throw new NotFoundError(NotFoundError.codes.CANNOT_FIND_MODEL, {
                        modelName  : e.modelName,
                        primaryKey : e.primaryKey
                    });
                } else throw e;
            } else throw e;
        }
    }

    _getDataToUpdate(data) {
        const dataToUpdate = { ...data };

        if (dataToUpdate.phone === '') dataToUpdate.phone = null;

        return dataToUpdate;
    }
}
