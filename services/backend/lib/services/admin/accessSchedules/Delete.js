import Base               from '../../Base';
import AccessSchedule  from '../../../models/AccessSchedule';
import sequelize          from '../../../sequelizeSingleton';
import DX from '../../../models/utils/DX';
import { NotFoundError } from '../../utils/SX';

export default class AccessScheduleDelete extends Base {
    static validationRules = {
        id : [ 'required', 'db_id' ]
    };

    async execute({ id }) {
        try {
            let accessSchedule = null;

            await sequelize.transaction(async transaction => {
                accessSchedule = await AccessSchedule.findByPkOrFail(id, { transaction });

                await accessSchedule.destroy({ transaction });
            });

            return {
                id : accessSchedule.id
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
