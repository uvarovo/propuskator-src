import Base              from '../../Base';
import AdminUser         from '../../../models/AdminUser';
import { dumpAdminUser } from '../../utils/dumps';
import DX from '../../../models/utils/DX';

export default class AdminUserShow extends Base {
    static validationRules = {}

    async execute() {
        try {
            const dbAdminUser = await AdminUser.findByPkOrFail(this.cls.get('userId'), {
                include : [
                    {
                        association : AdminUser.AssociationWorkspace,
                        required    : true
                    }
                ]
            });

            return {
                data : {
                    ...dumpAdminUser(dbAdminUser),
                    workspace : dbAdminUser.workspace.name
                }
            };
        } catch (e) {
            if (e instanceof DX) {// holly shield
                throw e;
            } else throw e;
        }
    }
}
