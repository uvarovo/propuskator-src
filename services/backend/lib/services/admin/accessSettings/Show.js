import Base           from '../../Base';
import AccessSetting from '../../../models/AccessSetting';
import {
    dumpAccessSetting
} from '../../utils/dumps';
import AccessSchedule from '../../../models/AccessSchedule';
import DX from '../../../models/utils/DX';
import { NotFoundError } from '../../utils/SX';

export default class AccessSettingShow extends Base {
    static validationRules = {
        id : [ 'required', 'db_id' ]
    };

    async execute({ id }) {
        try {
            const accessSetting = await AccessSetting.findByPkOrFail(id, {
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
                ]
            });

            return {
                data : dumpAccessSetting(accessSetting)
            };
        } catch (e) {
            if (e instanceof DX) {// holly shield
                if (e instanceof DX.NotFoundError) {
                    throw new NotFoundError(NotFoundError.codes.CANNOT_FIND_MODEL, {
                        modelName : e.modelName, primaryKey : e.primaryKey
                    });
                } else throw e;
            } else throw e;
        }
    }
}
