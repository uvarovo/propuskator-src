import Base         from '../../Base';
import AccessSchedule     from '../../../models/AccessSchedule';
import {
    dumpAccessSchedule
} from '../../utils/dumps';
import DX from '../../../models/utils/DX';
import { NotFoundError } from '../../utils/SX';

export default class AccessScheduleShow extends Base {
    static validationRules = {
        id : [ 'required', 'db_id' ]
    };

    async execute({ id }) {
        try {
            const accessSchedule = await AccessSchedule.findByPkOrFail(id, {
                include : [ AccessSchedule.AssociationAccessScheduleDates ]
            });

            return {
                data : dumpAccessSchedule(accessSchedule)
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
