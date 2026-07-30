import Base from '../../Base';
import AccessReadersMobileGroup from '../../../models/AccessReadersMobileGroup';
import { dumpAccessReadersMobileGroup } from '../../utils/dumps';
import sequelize from '../../../sequelizeSingleton';
import DX from '../../../models/utils/DX';
import { BadRequestError } from '../../utils/SX';
import groupLogsPaths from '../../../../etc/accessReaderMobileGroups/paths';

export default class Create extends Base {
    static validationRules = {
        name                 : [ 'required', 'string', 'trim', { 'max_length': 255 } ],
        logoType             : [ 'string', { 'one_of': Object.keys(groupLogsPaths) } ],
        logoColor            : [ 'string', 'trim', { 'max_length': 12 } ],
        accessTokenReaderIds : [ 'required', { 'list_of': 'db_id' }, 'list_items_unique' ]
    };

    async execute({ accessTokenReaderIds, ...data }) {
        try {
            let accessReadersMobileGroup = null;

            await sequelize.transaction(async transaction => {
                accessReadersMobileGroup = await AccessReadersMobileGroup.create({
                    ...data,
                    accessSubjectId : this.cls.get('accessSubjectId')
                }, { transaction });
                if (accessTokenReaderIds) {
                    await accessReadersMobileGroup.setAccessTokenReaders(accessTokenReaderIds, { transaction });
                }

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
            if (e instanceof DX.ForeignKeyConstraintError) {
                throw new BadRequestError(BadRequestError.codes.FOREIGN_KEY_CONSTRAINT, {
                    fields : e.fields, modelName : e.modelName
                });
            } else throw e;
        }
    }
}
