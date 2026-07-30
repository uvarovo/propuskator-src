
import cls              from '../../../cls';
import chista           from '../../chista.js';
import { errorHandler } from '../../errorHandler';

import SessionsCreate  from '../../../services/mobile/sessions/Create';
import SessionsCheck   from '../../../services/mobile/sessions/Check';
import { generateToken } from '../../../services/mobile/sessions/utils';

export default {
    create : chista.makeServiceRunner(SessionsCreate, req => ({
        ...req.body, ip : req.headers['x-real-ip']
    })),
    async check(req, res, next) {
        try {
            const { tokenData, user, accessSubject } = await chista.runService(SessionsCheck, {
                params : { token: req.get('X-AuthToken') }
            });

            /* eslint no-param-reassign: 0 */

            res.header('Access-Control-Expose-Headers', 'X-AuthToken');
            res.header('X-AuthToken', await generateToken(user));

            cls.set('userId', user.id);
            cls.set('workspaceId', user.workspaceId);
            cls.set('accessSubjectId', accessSubject.id);
            req.session = {
                context : {
                    userId      : tokenData.userId,
                    workspaceId : user.workspaceId
                }
            };

            return next();
        } catch (e) {
            return errorHandler(e, req, res);
        }
    }
};
