import Base         from '../../Base';
import AdminUser    from '../../../models/AdminUser';
import { ForbiddenError } from '../../utils/SX';
import DX from '../../../models/utils/DX';
import { checkRequestsFromIPBlocked, addRequestToAttempts } from '../../requestLimit';
import { generateToken, validateToken } from './utils';

export default class SessionsCreate extends Base {
    async validate(data) {
        let rules;

        if (data && data.token !== undefined) {
            rules = {
                token : [ 'required', 'string' ]
            };
        } else {
            rules = {
                login    : [ 'required', 'string', 'trim' ],
                password : [ 'required', 'string' ],
                ip       : [ 'required', 'string' ]
            };
        }

        return this.doValidation(data, rules);
    }

    async execute({ login, password, token, ip }) {
        try {
            let accessToken;

            if (token) {
                // eslint-disable-next-line no-unused-vars
                const [ tokenData, adminUser ] = await validateToken(token);

                accessToken = await generateToken(adminUser);
            } else {
                const adminUser = await AdminUser.findOne({ where: { login } });
                // check count request from ip
                const id = adminUser ? adminUser.id : null;
                const checkBlocked = await checkRequestsFromIPBlocked('admin', ip, id);

                if (checkBlocked) {
                    throw new ForbiddenError(ForbiddenError.codes.HTTP_TOO_MANY_REQUESTS_FOR_LOGIN);
                }

                if (!adminUser || !await adminUser.checkPassword(password)) {
                    // add fail attempt to db
                    await addRequestToAttempts('admin', ip, id);
                    throw new ForbiddenError(ForbiddenError.codes.AUTHENTICATION_FAILED);
                }
                accessToken = await generateToken(adminUser);
            }

            return {
                data : {
                    jwt : accessToken
                }
            };
        } catch (e) {
            if (e instanceof DX) {
                throw e;
            } else throw e;
        }
    }
}
