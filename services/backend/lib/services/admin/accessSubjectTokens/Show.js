import Base              from '../../Base';
import AccessSubjectToken         from '../../../models/AccessSubjectToken';
import { dumpAccessSubjectToken } from '../../utils/dumps';
import DX from '../../../models/utils/DX';
import { NotFoundError } from '../../utils/SX';

export default class AccessSubjectTokenShow extends Base {
    static validationRules = {
        id : [ 'required', 'db_id' ]
    };

    async execute({ id }) {
        try {
            const accessSubjectToken = await AccessSubjectToken.findByPkOrFail(id);

            return {
                data : dumpAccessSubjectToken(accessSubjectToken)
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
