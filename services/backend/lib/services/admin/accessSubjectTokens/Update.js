import Base              from '../../Base';
import {
    AccessSubjectToken,
    AccessTokenToReaderChangesMap
} from '../../../models';
import { ACTION_TYPES } from '../../../constants/accessTokenToReaderChangesMap';

import { dumpAccessSubjectToken } from '../../utils/dumps';
import sequelize from '../../../sequelizeSingleton';
import DX from '../../../models/utils/DX';
import { BadRequestError, NotFoundError, ValidationError } from '../../utils/SX';

export default class AccessSubjectTokenUpdate extends Base {
    static validationRules = {
        id              : [ 'required', 'db_id' ],
        name            : [ 'string', 'trim', 'not_empty', { 'fixed_max_length': 255 }, { 'fixed_min_length': 1 } ],
        code            : [ 'string', 'trim', 'not_empty', { 'fixed_max_length': 255 }, { 'fixed_min_length': 1 },  { 'custom_error_code': [ 'WRONG_ACCESS_SUBJECT_TOKEN_CODE_FORMAT', 'like', '^[A-Z0-9]+$' ] }  ],
        // type : [ 'not_empty', 'string', 'trim', { 'one_of': [
        //    AccessSubjectToken.TYPE_NFC, AccessSubjectToken.TYPE_RFID] } ],
        enabled         : [ 'boolean' ],
        isArchived      : [ 'boolean' ],
        accessSubjectId : [ 'db_id' ]
    };

    async execute({ id, ... data }) {
        try {
            const { code } = data;

            let accessSubjectToken = null;

            await sequelize.transaction(async transaction => {
                accessSubjectToken = await AccessSubjectToken.findByPkOrFail(id);

                // update accesses for all related access readers when "code" field is changed
                if (accessSubjectToken.enabled && accessSubjectToken.code !== code && code) {
                    const { accessTokenReaderIds } = await accessSubjectToken.getAssociatedEntitiesData();

                    // remove old "code" from all access readers
                    await AccessTokenToReaderChangesMap.addUpdates(
                        {
                            accessTokenReaderIds,
                            accessSubjectTokenCodes : [ accessSubjectToken.code ],
                            actionType              : ACTION_TYPES.REMOVE_ACCESS
                        },
                        { transaction }
                    );

                    // add new "code" to all access readers
                    await AccessTokenToReaderChangesMap.addUpdates(
                        {
                            accessTokenReaderIds,
                            accessSubjectTokenCodes : [ code ],
                            actionType              : ACTION_TYPES.ADD_ACCESS
                        },
                        { transaction }
                    );
                }

                await accessSubjectToken.update({ ...data, updatedAt: sequelize.fn('CURRENT_TIMESTAMP', 3) }, { transaction });

                await accessSubjectToken.reload({ transaction });
            });

            return {
                data : dumpAccessSubjectToken(accessSubjectToken)
            };
        } catch (e) {
            if (e instanceof DX) {
                if (e instanceof DX.ForeignKeyConstraintError) {
                    throw new BadRequestError(BadRequestError.codes.FOREIGN_KEY_CONSTRAINT, {
                        fields : e.fields, modelName : e.modelName
                    });
                } else if (e instanceof DX.UniqueConstraintError) {
                    if (e.modelName === 'AccessSubjectToken' && Object.keys(e.fields).length === 1 && Object.keys(e.fields)[0] === 'AccessSubjectTokens_workspaceId_code_deletedAt_uk') {
                        throw new ValidationError(ValidationError.codes.TOKEN_CODE_IS_USED, { field: 'code' });
                    } else {
                        throw e;
                    }
                } else if (e instanceof DX.NotFoundError) {
                    throw new NotFoundError(NotFoundError.codes.CANNOT_FIND_MODEL, {
                        modelName : e.modelName, primaryKey : e.primaryKey
                    });
                } else throw e;
            } else throw e;
        }
    }
}
