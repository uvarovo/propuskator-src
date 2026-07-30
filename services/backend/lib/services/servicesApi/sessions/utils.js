import jwt           from 'jsonwebtoken';
import { tokens }    from '../../../config';
import { ForbiddenError } from '../../utils/SX';

const TokenExpiredError = jwt.TokenExpiredError;
const JsonWebTokenError = jwt.JsonWebTokenError;

async function generateToken(payload, key) {
    return jwt.sign(payload, key);
}

async function validateToken(token) {
    try {
        const data = jwt.decode(token);

        if (!data || !data.type || !tokens.servicesTokens.hasOwnProperty(data.type)) {
            throw new JsonWebTokenError('invalid token');
        }

        const secret = tokens.servicesTokens[data.type];

        const tokenMaxAge = tokens.servicesTokens.lifetime;

        if (parseInt(tokenMaxAge, 10) !== 0 && (new Date() / 1000 - data.iat > tokenMaxAge)) {
            // TOKEN EXPIRED
            throw new TokenExpiredError('TOKEN EXPIRED', new Date((data.iat + tokenMaxAge) * 1000));
        }

        return jwt.verify(token, secret);
    } catch (e) {
        if (e instanceof TokenExpiredError) throw new ForbiddenError(ForbiddenError.codes.TOKEN_EXPIRED);
        else if (e instanceof JsonWebTokenError) throw new ForbiddenError(ForbiddenError.codes.WRONG_TOKEN);
        // eslint-disable-next-line more/no-duplicated-chains
        else throw new ForbiddenError(ForbiddenError.codes.WRONG_TOKEN);
    }
}

export default {
    generateToken, validateToken
};
