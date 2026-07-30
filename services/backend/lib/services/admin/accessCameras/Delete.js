import Base               from '../../Base';
import AccessCamera             from '../../../models/AccessCamera';
import sequelize          from '../../../sequelizeSingleton';
import DX from '../../../models/utils/DX';
import { NotFoundError } from '../../utils/SX';

export default class AccessCameraDelete extends Base {
    static validationRules = {
        id : [ 'required', 'db_id' ]
    };

    async execute({ id }) {
        try {
            let accessCamera = null;

            await sequelize.transaction(async transaction => {
                accessCamera = await AccessCamera.findByPkOrFail(id, { transaction });

                await accessCamera.destroy({ transaction });
                await this._removeLinkedCameras(accessCamera, { transaction });
            });

            return {
                id : accessCamera.id
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

    async _removeLinkedCameras(accessCamera, options) {
        await accessCamera.setAccessTokenReaders([], options);
    }
}
