import Base               from '../../Base';
import AccessSubject  from '../../../models/AccessSubject';
import sequelize          from '../../../sequelizeSingleton';
import DX from '../../../models/utils/DX';
import { NotFoundError } from '../../utils/SX';

export default class AccessSubjectDelete extends Base {
    static validationRules = {
        id : [ 'required', 'db_id' ]
    };

    async execute({ id }) {
        try {
            let accessSubject = null;

            await sequelize.transaction(async transaction => {
                accessSubject = await AccessSubject.findByPkOrFail(id, { transaction });

                await accessSubject.destroy({ transaction });
            });

            return {
                id : accessSubject.id
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
