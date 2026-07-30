import Base                       from '../../Base';
import AccessReadersGroup         from '../../../models/AccessReadersGroup';
import { dumpAccessReadersGroup } from '../../utils/dumps';
import sequelize                  from '../../../sequelizeSingleton';
import DX from '../../../models/utils/DX';
import { BadRequestError, NotFoundError, ValidationError } from '../../utils/SX';

export default class AccessReadersGroupUpdate extends Base {
    static validationRules = {
        id                   : [ 'required', 'db_id' ],
        name                 : [ 'not_empty', 'string', 'trim', { 'max_length': 255 } ],
        enabled              : [ 'boolean' ],
        isArchived           : [ 'boolean' ],
        color                : [ 'not_empty', 'string', { 'max_length': 255 } ],
        accessTokenReaderIds : [ { 'list_of': 'db_id' } ]
    };

    async execute({ id, accessTokenReaderIds, ...data }) {
        try {
            let accessReadersGroup = null;

            await sequelize.transaction(async transaction => {
                accessReadersGroup = await AccessReadersGroup.findByPkOrFail(id, { transaction });
                // accessReadersGroup.changed('updatedAt', true);
                accessReadersGroup.set({ ...data, updatedAt: sequelize.fn('CURRENT_TIMESTAMP', 3) });
                await accessReadersGroup.save({ transaction });
                await accessReadersGroup.updateReaderTokens({ transaction });
                if (accessTokenReaderIds) {
                    await accessReadersGroup.setAccessTokenReaders(accessTokenReaderIds, { transaction });
                }
                await accessReadersGroup.updateReaderTokens({ transaction });
                await accessReadersGroup.reload({
                    include : [
                        {
                            association : AccessReadersGroup.AssociationAccessTokenReaders,
                            required    : false
                        }
                    ],
                    transaction
                });
            });

            return {
                data : dumpAccessReadersGroup(accessReadersGroup)
            };
        } catch (e) {
            if (e instanceof DX) {
                if (e instanceof DX.ForeignKeyConstraintError) {
                    throw new BadRequestError(BadRequestError.codes.FOREIGN_KEY_CONSTRAINT, {
                        fields : e.fields, modelName : e.modelName
                    });
                } else if (e instanceof DX.UniqueConstraintError) {
                    if (e.modelName === 'AccessReadersGroup' && Object.keys(e.fields).length === 1 && Object.keys(e.fields)[0] === 'AccessReadersGroups_workspaceId_name_deletedAt_uk') {
                        throw new ValidationError(ValidationError.codes.GROUP_NAME_IS_USED, { field: 'name' });
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
