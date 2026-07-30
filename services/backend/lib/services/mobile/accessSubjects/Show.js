import Base              from '../../Base';
import AccessSubject         from '../../../models/AccessSubject';
import { dumpMobileAccessSubject } from '../../utils/dumps';
import DX from '../../../models/utils/DX';

export default class AccessSubjectShow extends Base {
    static validationRules = {}

    async execute() {
        try {
            const userId = this.cls.get('userId');

            if (!userId) throw new Error('Bad request');
            const accessSubject = await AccessSubject.findOne({
                where : { userId }
            });

            return {
                data : await dumpMobileAccessSubject(accessSubject)
            };
        } catch (e) {
            if (e instanceof DX) {// holly shield
                throw e;
            } else throw e;
        }
    }
}
