import Base from '../../Base';
import User from '../../../models/User';
import DX   from '../../../models/utils/DX';

export default class AdminUserMqttCredentials extends Base {
    static validationRules = {}

    async execute() {
        try {
            const dbUser = await User.findByPkOrFail(this.cls.get('userId'), {
                include : [ User.AssociationWorkspace ]
            });

            return {
                data : await dbUser.getMqttCredentials()
            };
        } catch (e) {
            if (e instanceof DX) {// holly shield
                throw e;
            } else throw e;
        }
    }
}
