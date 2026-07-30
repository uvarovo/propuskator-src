import jwt           from 'jsonwebtoken';
import { customAlphabet } from 'nanoid';
import { tokens }    from '../../../config';
import Workspace         from '../../../models/Workspace';
import User         from '../../../models/User';
import AccessSubject         from '../../../models/AccessSubject';
import { ForbiddenError } from '../../utils/SX';

const TokenExpiredError = jwt.TokenExpiredError;
const JsonWebTokenError = jwt.JsonWebTokenError;

const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const idSize = 6;
const nanoid = customAlphabet(alphabet, idSize);

const resetPasswordToken = tokens.mobilePasswordResetToken;

export default {
    resetPassword : {
        generateCode() {
            return nanoid();
        },
        generateToken(dbWorkspace, dbUser, code) {
            return jwt.sign({
                workspace : dbWorkspace.name,
                email     : dbUser.email
            }, [ resetPasswordToken.secret, dbWorkspace.name, dbUser.email, dbUser.passwordHash, code ].join('-'));
        },
        async validateToken(token, code) {
            try {
                const data = jwt.decode(token);

                if (!data || !data.workspace || !data.email) throw new JsonWebTokenError('invalid token');

                const tokenMaxAge = resetPasswordToken.lifetime;

                if (parseInt(tokenMaxAge, 10) !== 0 && (new Date() / 1000 - data.iat > tokenMaxAge)) {
                    // TOKEN EXPIRED
                    throw new TokenExpiredError('TOKEN EXPIRED', new Date((data.iat + tokenMaxAge) * 1000));
                }
                let dbUser = null;

                const { workspace, email } = data;

                const dbWorkspace = await Workspace.findOne({ where: { name: workspace } });

                if (!dbWorkspace) throw new JsonWebTokenError('invalid token');

                dbUser = await User.findOne({ where: { email, workspaceId: dbWorkspace.id } });

                const dbAccessSubject = dbUser && await AccessSubject.findOne({
                    where : {
                        userId      : dbUser.id,
                        email       : dbUser.email,
                        workspaceId : dbUser.workspaceId
                        // mobileEnabled : true,
                        // enabled       : true
                    }
                });

                if (!dbUser) throw new JsonWebTokenError('invalid token');

                if (!dbAccessSubject.mobileEnabled || !dbAccessSubject.enabled) throw new JsonWebTokenError('invalid token');

                const secret = [ resetPasswordToken.secret, dbWorkspace.name, dbUser.email, dbUser.passwordHash, code ].join('-');

                return [ jwt.verify(token, secret), dbWorkspace, dbUser ];
            } catch (e) {
                if (e instanceof TokenExpiredError) throw new ForbiddenError(ForbiddenError.codes.TOKEN_EXPIRED);
                else if (e instanceof JsonWebTokenError) throw new ForbiddenError(ForbiddenError.codes.WRONG_TOKEN);
                // eslint-disable-next-line more/no-duplicated-chains
                else throw new ForbiddenError(ForbiddenError.codes.WRONG_TOKEN);
            }
        }
    }
};
