import cls              from '../../../cls';
import chista           from '../../chista.js';
import { errorHandler } from '../../errorHandler';

import SessionsCreate  from '../../../services/admin/sessions/Create';
import SessionsCheck   from '../../../services/admin/sessions/Check';
import { generateToken } from '../../../services/admin/sessions/utils';


export default {
    create : chista.makeServiceRunner(SessionsCreate, req => ({
        ...req.body,
        ip : req.headers['x-real-ip']
    })),
    async check(req, res, next) {
        try {
            const promise = chista.runService(SessionsCheck, {
                params : { token: req.get('X-AuthToken') }
            });
            const { tokenData, adminUser } = await promise;

            /* eslint no-param-reassign: 0 */

            res.header('Access-Control-Expose-Headers', 'X-AuthToken');
            res.header('X-AuthToken', await generateToken(adminUser));
            cls.set('userId', tokenData.userId);
            cls.set('workspaceId', adminUser.workspaceId);

            req.session = {
                context : {
                    userId      : tokenData.userId,
                    workspaceId : adminUser.workspaceId
                }
            };

            return next();
        } catch (e) {
            return errorHandler(e, req, res);
        }
    }
};
