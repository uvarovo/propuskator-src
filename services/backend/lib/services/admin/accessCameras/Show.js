import Base         from '../../Base';
import AccessCamera             from '../../../models/AccessCamera';
import { dumpAccessCamera } from '../../utils/dumps';
import DX from '../../../models/utils/DX';
import { NotFoundError } from '../../utils/SX';

export default class AccessCameraShow extends Base {
    static validationRules = {
        id : [ 'required', 'db_id' ]
    };

    async execute({ id }) {
        try {
            const accessCamera = await AccessCamera.findByPkOrFail(id, {
                include : [ { association: AccessCamera.AssociationAccessTokenReaders, required: false } ]
            });

            return {
                data : dumpAccessCamera(accessCamera)
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
