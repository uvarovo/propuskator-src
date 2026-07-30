import Base                       from '../../Base';
import AccessReadersGroup         from '../../../models/AccessReadersGroup';
import { dumpAccessReadersGroup } from '../../utils/dumps';
import DX from '../../../models/utils/DX';
import { NotFoundError } from '../../utils/SX';

export default class AccessReadersGroupShow extends Base {
    static validationRules = {
        id : [ 'required', 'db_id' ]
    };

    async execute({ id }) {
        try {
            const accessReadersGroup = await AccessReadersGroup.findByPkOrFail(id, {
                include : [
                    {
                        association : AccessReadersGroup.AssociationAccessTokenReaders,
                        required    : false
                    }
                ]
            });

            return {
                data : dumpAccessReadersGroup(accessReadersGroup)
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
