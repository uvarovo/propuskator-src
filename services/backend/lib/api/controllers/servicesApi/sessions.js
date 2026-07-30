import chista           from '../../chista.js';
import { errorHandler } from '../../errorHandler';

import SessionCreate  from '../../../services/servicesApi/sessions/Create';
import SessionCheck   from '../../../services/servicesApi/sessions/Check';


export default {
    create : chista.makeServiceRunner(SessionCreate, req => ({ ...req.body })),
    async check(req, res, next) {
        try {
            const promise = chista.runService(SessionCheck, {
                params : { token: req.get('X-AuthToken') }
            });
            const { data : payload } = await promise;

            req.session = { // eslint-disable-line no-param-reassign
                context : {
                    type    : payload.type,
                    payload : payload.payload
                }
            };

            return next();
        } catch (e) {
            return errorHandler(e, req, res);
        }
    }
};
