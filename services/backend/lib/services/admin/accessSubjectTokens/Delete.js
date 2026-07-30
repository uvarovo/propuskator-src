import Base               from '../../Base';
import AccessSubjectToken  from '../../../models/AccessSubjectToken';
import sequelize          from '../../../sequelizeSingleton';
import DX from '../../../models/utils/DX';
import { NotFoundError } from '../../utils/SX';

export default class AccessSubjectTokenDelete extends Base {
    static validationRules = {
        id : [ 'required', 'db_id' ]
    };

    async execute({ id }) {
        try {
            let accessSubjectToken = null;

            await sequelize.transaction(async transaction => {
                accessSubjectToken = await AccessSubjectToken.findByPkOrFail(id, { transaction });

                await accessSubjectToken.destroy({ transaction });
            });

            return {
                id : accessSubjectToken.id
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
