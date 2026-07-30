import Base               from '../../Base';
import AccessReadersGroup from '../../../models/AccessReadersGroup';
import sequelize          from '../../../sequelizeSingleton';
import DX from '../../../models/utils/DX';
import { NotFoundError } from '../../utils/SX';

export default class AccessReadersGroupDelete extends Base {
    static validationRules = {
        id : [ 'required', 'db_id' ]
    };

    async execute({ id }) {
        try {
            let accessReadersGroup = null;

            await sequelize.transaction(async transaction => {
                accessReadersGroup = await AccessReadersGroup.findByPkOrFail(id, { transaction });

                await accessReadersGroup.updateReaderTokens({ transaction });
                await accessReadersGroup.destroy({ transaction });
            });

            return {
                id : accessReadersGroup.id
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
