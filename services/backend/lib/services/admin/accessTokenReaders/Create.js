import Base              from '../../Base';
import AccessTokenReader from '../../../models/AccessTokenReader';
import Notification from '../../../models/Notification';
import {
    dumpAccessTokenReader
} from '../../utils/dumps';
import sequelize from '../../../sequelizeSingleton';
import { ACTION_TYPES } from '../../../constants/accessTokenToReaderChangesMap.js';
import DX from '../../../models/utils/DX';
import { BadRequestError, ValidationError } from '../../utils/SX';

export default class AccessTokenReaderCreate extends Base {
    static validationRules = {
        name                  : [ 'required', 'string', 'trim', 'not_empty', { 'fixed_max_length': 255 }, { 'fixed_min_length': 1 } ],
        phone                 : [ 'string', 'trim', 'phone', { 'max_length': 255 }, { 'default': null } ],
        code                  : [ 'required', 'string', 'trim', 'not_empty', { 'fixed_max_length': 255 }, { 'fixed_min_length': 1 },  { 'custom_error_code': [ 'WRONG_TOKEN_READER_CODE_FORMAT', 'like', '^[a-zA-Z0-9:\\-_]+$' ] }  ],
        enabled               : [ 'boolean', { 'default': true } ],
        isArchived            : [ 'boolean', { 'default': false } ],
        accessReadersGroupIds : [ { 'list_of': 'db_id' } ]
    };

    async execute({ accessReadersGroupIds, ...data }) {
        try {
            let accessTokenReader = null;

            await sequelize.transaction(async transaction => {
                accessTokenReader = await AccessTokenReader.create(data, { transaction });
                if (accessReadersGroupIds) {
                    await accessTokenReader.setAccessReadersGroups(accessReadersGroupIds, { transaction });
                }
                // manually add access for related tokens, because it is impossible to implement this logic
                // in "afterCreate" hook because there are no set relations right after setting creation
                await accessTokenReader.updateReaderTokens({ transaction }, { actionType: ACTION_TYPES.ADD_ACCESS });
                await accessTokenReader.reload({
                    include : [
                        {
                            association : AccessTokenReader.AssociationAccessReadersGroups,
                            required    : false
                        }
                    ],
                    transaction
                });
                await Notification.update({
                    accessTokenReaderId : accessTokenReader.id
                }, {
                    where : {
                        type                : Notification.alwaysEnabledTypes.NEW_READER,
                        accessTokenReaderId : null,
                        data                : { tokenReaderCode: accessTokenReader.code }
                    },
                    transaction
                });
            });

            return {
                data : dumpAccessTokenReader(accessTokenReader)
            };
        } catch (e) {
            if (e instanceof DX) {
                if (e instanceof DX.ForeignKeyConstraintError) {
                    throw new BadRequestError(BadRequestError.codes.FOREIGN_KEY_CONSTRAINT, {
                        fields : e.fields, modelName : e.modelName
                    });
                } else if (e instanceof DX.UniqueConstraintError) {
                    if (e.modelName === 'AccessTokenReader' && Object.keys(e.fields).length === 1 && Object.keys(e.fields)[0] === 'AccessTokenReaders_workspaceId_name_deletedAt_uk') {
                        throw new ValidationError(ValidationError.codes.READER_NAME_IS_USED, { field: 'name' });
                    } else if (e.modelName === 'AccessTokenReader' && Object.keys(e.fields).length === 1 && Object.keys(e.fields)[0] === 'AccessTokenReaders_workspaceId_code_deletedAt_uk') {
                        throw new ValidationError(ValidationError.codes.READER_CODE_IS_USED, { field: 'code' });
                    } else if (e.modelName === 'AccessTokenReader' && Object.keys(e.fields).length === 1 && Object.keys(e.fields)[0] === 'AccessTokenReaders_workspaceId_phone_deletedAt_uk') {
                        throw new ValidationError(ValidationError.codes.READER_PHONE_IS_USED, { field: 'phone' });
                    } else if (e.modelName === 'MqttUser' && Object.keys(e.fields).length === 1 && Object.keys(e.fields)[0] === 'username') {
                        // eslint-disable-next-line more/no-duplicated-chains
                        throw new ValidationError(ValidationError.codes.READER_CODE_IS_USED, { field: 'code' });
                    } else {
                        throw e;
                    }
                } else throw e;
            } else throw e;
        }
    }
}
