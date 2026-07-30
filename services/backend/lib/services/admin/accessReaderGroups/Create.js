import Base                       from '../../Base';
import AccessReadersGroup         from '../../../models/AccessReadersGroup';
import { dumpAccessReadersGroup } from '../../utils/dumps';
import getRandomColor             from '../../utils/colors';
import sequelize                  from '../../../sequelizeSingleton';
import DX                         from '../../../models/utils/DX';
import {
    BadRequestError, ValidationError
} from '../../utils/SX';

export default class AccessReadersGroupCreate extends Base {
    static validationRules = {
        name                 : [ 'required', 'string', 'trim', { 'max_length': 255 } ],
        enabled              : [ 'boolean', { 'default': true } ],
        isArchived           : [ 'boolean', { 'default': false } ],
        color                : [ 'string', { 'max_length': 255 } ],
        accessTokenReaderIds : [ { 'list_of': 'db_id' } ]
    };

    async execute({ accessTokenReaderIds, ... data }) {
        try {
            if (!data.color) {
                // eslint-disable-next-line no-param-reassign
                data.color = getRandomColor();
            }

            let accessReadersGroup = null;

            await sequelize.transaction(async transaction => {
                accessReadersGroup = await AccessReadersGroup.create(data, { transaction });
                if (accessTokenReaderIds) {
                    await accessReadersGroup.setAccessTokenReaders(accessTokenReaderIds, { transaction });
                }
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
            if (e instanceof DX) {// holly shield
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
                } else throw e;
            } else throw e;
        }
    }
}
