import Base                  from '../../Base';
import AccessSetting         from '../../../models/AccessSetting';
import AccessSchedule        from '../../../models/AccessSchedule';
import { ACTION_TYPES }      from '../../../constants/accessTokenToReaderChangesMap.js';
import { dumpAccessSetting } from '../../utils/dumps';
import sequelize             from '../../../sequelizeSingleton';
import DX from '../../../models/utils/DX';
import { BadRequestError } from '../../utils/SX';

export default class AccessSettingCreate extends Base {
    static validationRules = {
        accessReadersGroupIds : [ 'required', 'list_items_unique', { 'list_of': [ 'db_id' ] }, 'filter_empty_values' ],
        accessTokenReaderIds  : [ 'required', 'list_items_unique', { 'list_of': [ 'db_id' ] }, { 'required_if_other_fields_empty': [ 'accessReadersGroupIds' ] }, 'filter_empty_values' ],
        accessScheduleIds     : [ 'required', 'list_items_unique', { 'list_of': [ 'db_id' ] }, 'fixed_not_empty_list', 'filter_empty_values' ],
        accessSubjectIds      : [ 'required', 'list_items_unique', { 'list_of': [ 'db_id' ] }, 'fixed_not_empty_list', 'filter_empty_values' ],
        enabled               : [ 'boolean', { 'default': true } ],
        isArchived            : [ 'boolean', { 'default': false } ]
    };

    async execute({ accessReadersGroupIds, accessTokenReaderIds, accessScheduleIds, accessSubjectIds, ...data }) {
        try {
            let accessSetting = null;

            await sequelize.transaction(async transaction => {
                accessSetting = await AccessSetting.create(data, { transaction });

                await accessSetting.setAccessReadersGroups(accessReadersGroupIds, { transaction });
                await accessSetting.setAccessTokenReaders(accessTokenReaderIds, { transaction });
                await accessSetting.setAccessSchedules(accessScheduleIds, { transaction });
                await accessSetting.setAccessSubjects(accessSubjectIds, { transaction });

                // manually add access for related tokens, because it is impossible to implement this logic
                // in "afterCreate" hook because there are no set relations right after setting creation
                await accessSetting.updateReaderTokens({ transaction }, { actionType: ACTION_TYPES.ADD_ACCESS });

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
            });

            return {
                data : dumpAccessSetting(accessSetting)
            };
        } catch (e) {
            if (e instanceof DX) {
                if (e instanceof DX.ForeignKeyConstraintError) {
                    throw new BadRequestError(BadRequestError.codes.FOREIGN_KEY_CONSTRAINT, {
                        fields : e.fields, modelName : e.modelName
                    });
                } else if (e instanceof DX.UniqueConstraintError) {
                    throw new BadRequestError(BadRequestError.codes.UNIQUE_CONSTRAINT, {
                        fields : e.fields, modelName : e.modelName
                    });
                } else throw e;
            } else throw e;
        }
    }
}
