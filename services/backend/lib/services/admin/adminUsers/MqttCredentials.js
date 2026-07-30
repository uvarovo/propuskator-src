import Base              from '../../Base';
import AdminUser         from '../../../models/AdminUser';
import DX from '../../../models/utils/DX';

export default class AdminUserMqttCredentials extends Base {
    static validationRules = {}

    async execute() {
        try {
            const dbAdminUser = await AdminUser.findByPkOrFail(this.cls.get('userId'), {
                include : [ AdminUser.AssociationWorkspace ]
            });

            return {
                data : await dbAdminUser.getMqttCredentials()
            };
        } catch (e) {
            if (e instanceof DX) {// holly shield
                throw e;
            } else throw e;
        }
    }
}
