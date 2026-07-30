import Base              from '../../Base';
import AccessSubject         from '../../../models/AccessSubject';
import AccessSubjectToken         from '../../../models/AccessSubjectToken';
import { dumpAccessSubjectToken } from '../../utils/dumps';
import DX from '../../../models/utils/DX';
import { NotFoundError } from '../../utils/SX';

export default class AccessSubjectTokenList extends Base {
    static validationRules = {};

    async execute() {
        try {
            const userId = this.cls.get('userId');

            if (!userId) throw new Error('Bad request');

            const accessSubject = await AccessSubject.findOne({
                where : { userId }
            });

            if (!accessSubject) {
                throw new NotFoundError(NotFoundError.codes.CANNOT_FIND_MODEL, { modelName: accessSubject.name });
            }

            const accessSubjectTokens = await AccessSubjectToken.findAll({
                where : {
                    accessSubjectId : accessSubject.id,
                    isArchived      : false
                },
                orderBy : [ [ 'name', 'ASC' ] ]
            });

            return {
                data : accessSubjectTokens.map(dumpAccessSubjectToken)
            };
        } catch (e) {
            if (e instanceof DX) {// holly shield
                throw e;
            } else throw e;
        }
    }
}
