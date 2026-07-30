import jwt from 'jsonwebtoken';

import { ForbiddenError } from '../services/utils/SX';
import { initLogger }     from '../extensions/Logger';

const logger = initLogger('JWT utils');

function decodeToken(token) {
    try {
        return jwt.decode(token);
    } catch (err) {
        logger.warn(`decodeToken: ${err.message}`);

        throw new ForbiddenError(ForbiddenError.codes.WRONG_TOKEN);
    }
}

export {
    decodeToken
};
