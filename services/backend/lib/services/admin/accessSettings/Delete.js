import Base               from '../../Base';
import AccessSetting  from '../../../models/AccessSetting';
import sequelize          from '../../../sequelizeSingleton';
import DX from '../../../models/utils/DX';
import { NotFoundError } from '../../utils/SX';

export default class AccessSettingDelete extends Base {
    static validationRules = {
        id : [ 'required', 'db_id' ]
    };

    async execute({ id }) {
        try {
            let accessSetting = null;

            await sequelize.transaction(async transaction => {
                accessSetting = await AccessSetting.findByPkOrFail(id, { transaction });

                await accessSetting.destroy({ transaction });
            });

            return {
                id : accessSetting.id
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
