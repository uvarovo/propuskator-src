import cls              from '../../../../cls';
import chista from '../../../chista.js';
import { errorHandler } from '../../../errorHandler';
import { initLogger } from '../../../../extensions/Logger';

import SessionsCheck from '../../../../services/tokenReader/v1/sessions/Check';

const logger = initLogger('SESSOINS_CHECK');

export default {
    async check(req, res, next) {
        try {
            const {
                tokenReaderId,
                tokenReaderActiveAt,
                accessTokenReader
            } = await chista.runService(SessionsCheck, {
                params : {
                    token : req.get('X-AuthToken'),
                    code  : req.get('X-AuthReader')
                }
            });

            cls.set('tokenReaderId', tokenReaderId);
            cls.set('workspaceId', accessTokenReader.workspaceId);

            /* eslint no-param-reassign: 0 */
            req.session = {
                context : {
                    tokenReaderId,
                    tokenReaderActiveAt,
                    accessTokenReader,
                    workspaceId : accessTokenReader.workspaceId
                }
            };

            return next();
        } catch (e) {
            logger.error(e);

            return errorHandler(e, req, res);
        }
    }
};
