import jwt           from 'jsonwebtoken';
import { tokens }    from '../../../config';
import AdminUser         from '../../../models/AdminUser';
import { ForbiddenError } from '../../utils/SX';

const TokenExpiredError = jwt.TokenExpiredError;
const JsonWebTokenError = jwt.JsonWebTokenError;
const resetPasswordToken = tokens.adminPasswordResetToken;

export default {
    resetPassword : {
        generateToken(dbAdminUser, actionId) {
            return jwt.sign({
                email : dbAdminUser.login,
                actionId
            }, [ resetPasswordToken.secret, dbAdminUser.login, dbAdminUser.passwordHash ].join('-'));
        },
        async validateToken(token) {
            try {
                const data = jwt.decode(token);

                if (!data || !data.email || !data.actionId) throw new ForbiddenError('Invalid token');

                const tokenMaxAge = resetPasswordToken.lifetime;

                if (parseInt(tokenMaxAge, 10) !== 0 && (new Date() / 1000 - data.iat > tokenMaxAge)) {
                    // TOKEN EXPIRED
                    throw new ForbiddenError('Token expired');
                }

                const { email: login } = data;

                const dbAdminUser = await AdminUser.findOne({ where: { login } });

                const secret = [ resetPasswordToken.secret, dbAdminUser.login, dbAdminUser.passwordHash ].join('-');

                return [ jwt.verify(token, secret), dbAdminUser ];
            } catch (e) {
                if (e instanceof TokenExpiredError) throw new ForbiddenError(ForbiddenError.codes.TOKEN_EXPIRED);
                else if (e instanceof JsonWebTokenError) throw new ForbiddenError(ForbiddenError.codes.WRONG_TOKEN);
                // eslint-disable-next-line more/no-duplicated-chains
                else throw new ForbiddenError(ForbiddenError.codes.WRONG_TOKEN);
            }
        }
    }
};
