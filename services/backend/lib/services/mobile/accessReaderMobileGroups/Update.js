import Base from '../../Base';
import AccessReadersMobileGroup from '../../../models/AccessReadersMobileGroup';
import { dumpAccessReadersMobileGroup } from '../../utils/dumps';
import sequelize from '../../../sequelizeSingleton';
import DX from '../../../models/utils/DX';
import { BadRequestError, NotFoundError } from '../../utils/SX';
import groupLogsPaths from '../../../../etc/accessReaderMobileGroups/paths';

export default class Update extends Base {
    static validationRules = {
        id                   : [ 'required', 'db_id' ],
        name                 : [ 'not_empty', 'string', 'trim', { 'max_length': 255 } ],
        logoType             : [ 'string', { 'one_of': Object.keys(groupLogsPaths) } ],
        logoColor            : [ 'string', 'trim', { 'max_length': 12 } ],
        accessTokenReaderIds : [ { 'list_of': 'db_id' }, 'list_items_unique' ]
    };

    async execute({ id, accessTokenReaderIds, ...data }) {
        try {
            let accessReadersMobileGroup = null;

            await sequelize.transaction(async transaction => {
                accessReadersMobileGroup = await AccessReadersMobileGroup.findByPkOrFail(id, { transaction });
                accessReadersMobileGroup.set(data);
                if (accessTokenReaderIds) {
                    await accessReadersMobileGroup.setAccessTokenReaders(accessTokenReaderIds, { transaction });
                }

                await accessReadersMobileGroup.save({ transaction });
                await accessReadersMobileGroup.reload({
                    include : [
                        {
                            association : AccessReadersMobileGroup.AssociationAccessTokenReaders,
                            required    : false
                        }
                    ],
                    transaction
                });
            });


            return {
                data : dumpAccessReadersMobileGroup(accessReadersMobileGroup)
            };
        } catch (e) {
            if (e instanceof DX) {
                if (e instanceof DX.ForeignKeyConstraintError) {
                    throw new BadRequestError(BadRequestError.codes.FOREIGN_KEY_CONSTRAINT, {
                        fields : e.fields, modelName : e.modelName
                    });
                } else if (e instanceof DX.NotFoundError) {
                    throw new NotFoundError(NotFoundError.codes.CANNOT_FIND_MODEL, {
                        modelName : e.modelName, primaryKey : e.primaryKey
                    });
                } else throw e;
            } else throw e;
        }
    }
}
