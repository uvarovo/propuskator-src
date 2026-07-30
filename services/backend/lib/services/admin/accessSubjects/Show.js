import Base         from '../../Base';
import AccessSubject     from '../../../models/AccessSubject';
import { dumpAccessSubject } from '../../utils/dumps';
import DX from '../../../models/utils/DX';
import { NotFoundError } from '../../utils/SX';

export default class AccessSubjectShow extends Base {
    static validationRules = {
        id : [ 'required', 'db_id' ]
    };

    async execute({ id }) {
        try {
            const subject = await AccessSubject.findByPkOrFail(id, {
                include : [ { association: AccessSubject.AssociationAccessSubjectTokens, required: false } ]
            });

            return {
                data : dumpAccessSubject(subject)
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
