import Base               from '../../Base';
import AccessTokenReader  from '../../../models/AccessTokenReader';
import sequelize          from '../../../sequelizeSingleton';
import DX from '../../../models/utils/DX';
import { NotFoundError } from '../../utils/SX';

export default class AccessTokenReaderDelete extends Base {
    static validationRules = {
        id : [ 'required', 'db_id' ]
    };

    async execute({ id }) {
        try {
            let accessTokenReader = null;

            await sequelize.transaction(async transaction => {
                accessTokenReader = await AccessTokenReader.findByPkOrFail(id, { transaction });

                await accessTokenReader.updateReaderTokens({ transaction });
                await accessTokenReader.destroy({ transaction });
            });

            return {
                id : accessTokenReader.id
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
