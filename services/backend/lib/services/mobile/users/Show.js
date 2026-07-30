import Base              from '../../Base';
import User         from '../../../models/User';
import { dumpUser } from '../../utils/dumps';
import DX from '../../../models/utils/DX';

export default class UserShow extends Base {
    static validationRules = {}

    async execute() {
        try {
            const dbUser = await User.findByPkOrFail(this.cls.get('userId'));

            return {
                data : dumpUser(dbUser)
            };
        } catch (e) {
            if (e instanceof DX) {// holly shield
                throw e;
            } else throw e;
        }
    }
}
