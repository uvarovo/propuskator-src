import jwt           from 'jsonwebtoken';
import { tokens }    from '../../../config';
import AdminUser     from '../../../models/AdminUser';
import { ForbiddenError } from '../../utils/SX';

const TokenExpiredError = jwt.TokenExpiredError;
const JsonWebTokenError = jwt.JsonWebTokenError;

async function generateToken(adminUser) {
    // return jwt.sign(data, secret, { expiresIn: configToken.maxAge });
    return jwt.sign({
        // tcat   : new Date() / 1000,
        userId : adminUser.id
    }, tokens.accessToken.secret + adminUser.login + adminUser.passwordHash);
}
async function validateToken(token) {
    try {
        const data = jwt.decode(token);

        if (!data || !data.userId) throw new JsonWebTokenError('invalid token');

        const adminUser = await AdminUser.findByPk(data.userId);

        if (!adminUser) throw new JsonWebTokenError('invalid token');

        const secret = tokens.accessToken.secret + adminUser.login + adminUser.passwordHash;

        const tokenMaxAge = tokens.accessToken.lifetime;

        if (parseInt(tokenMaxAge, 10) !== 0 && (new Date() / 1000 - data.iat > tokenMaxAge)) {
            // TOKEN EXPIRED
            throw new TokenExpiredError('TOKEN EXPIRED', new Date((data.iat + tokenMaxAge) * 1000));
        }

        return [ jwt.verify(token, secret), adminUser ];
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
