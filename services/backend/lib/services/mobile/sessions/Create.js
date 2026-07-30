import Base         from '../../Base';
import User from '../../../models/User';
import Workspace from '../../../models/Workspace';
import AccessSubject from '../../../models/AccessSubject';
import UserRegistrationRequest from '../../../models/UserRegistrationRequest.js';
import { ValidationError } from '../../utils/SX';
import DX from '../../../models/utils/DX';
import { checkRequestsFromIPBlocked, addRequestToAttempts } from '../../requestLimit';
import { dumpMobileAccessSubject } from '../../utils/dumps';
import { generateToken, validateToken } from './utils';

export default class SessionsCreate extends Base {
    async validate(data) {
        const rules = {};

        if (data && data.token !== undefined) {
            rules.token = [ 'required', 'string' ];
        } else {
            rules.workspace = [ 'required', 'string', 'trim', 'not_empty', { 'fixed_max_length': 50 }, { 'fixed_min_length': 3 },  { 'custom_error_code': [ 'WRONG_WORKSPACE_NAME_FORMAT', 'like', '^[a-z0-9]+$' ] }  ];
            rules.email = [ 'required', 'string', 'trim' ];
            rules.password = [ 'required', 'string' ];
            rules.ip = [ 'required', 'string' ];
        }

        return this.doValidation(data, rules);
    }

    async execute({ workspace, email, password, token, ip }) {
        try {
            let accessToken;

            let accessSubject;

            if (token) {
                // eslint-disable-next-line no-unused-vars
                const [ tokenData, user ] = await validateToken(token);

                accessSubject = user && await AccessSubject.findOne({
                    where : {
                        userId      : user.id,
                        email       : user.email,
                        workspaceId : user.workspaceId
                        // mobileEnabled : true,
                        // enabled       : true
                    }
                });

                accessToken = await generateToken(user);
            } else {
                const dbWorkspace = await Workspace.findOne({ where: { name: workspace } });

                if (!dbWorkspace) {
                    await addRequestToAttempts('user', ip);
                    throw new ValidationError(ValidationError.codes.WORKSPACE_NOT_FOUND, { field: 'workspace' });
                }

                const user = await User.findOne({ where: { email, workspaceId: dbWorkspace.id }, paranoid: false });
                const isUserDeleteHimself = user && user.deletedAt;

                // Throws an error in the case when admin is not processed the registration request yet
                if (!user || isUserDeleteHimself) {
                    const registrationRequest = await UserRegistrationRequest.findOne({
                        where : {
                            workspaceId : dbWorkspace.id,
                            email
                        }
                    });

                    if (registrationRequest) {
                        throw new ValidationError(ValidationError.codes.REGISTRATION_REQUEST_IN_PROCESSING);
                    }
                }

                const id = user ? user.id : null;
                // check count request from ip
                const checkBlocked = await checkRequestsFromIPBlocked('user', ip, id);

                if (checkBlocked) {
                    throw new ValidationError(ValidationError.codes.HTTP_TOO_MANY_REQUESTS_FOR_LOGIN);
                }

                accessSubject = user && await AccessSubject.findOne({
                    where : {
                        userId      : user.id,
                        email       : user.email,
                        workspaceId : user.workspaceId
                        // mobileEnabled : true,
                        // enabled       : true
                    }
                });

                if (!user || !accessSubject || !await user.checkPassword(password) || isUserDeleteHimself) {
                    await addRequestToAttempts('user', ip, id);
                    throw new ValidationError(ValidationError.codes.WRONG_EMAIL_OR_PASSWORD);
                }

                if (!accessSubject.mobileEnabled || !accessSubject.enabled)  throw new ValidationError(ValidationError.codes.ACCESS_IS_TEMPORARILY_DENIED, { field: 'workspace'  });

                accessToken = await generateToken(user);
            }

            return {
                data : {
                    accessSubject : await dumpMobileAccessSubject(accessSubject),
                    // jwt is placed in "data" object for backward compatibility with mobile app
                    jwt           : accessToken
                }
            };
        } catch (e) {
            if (e instanceof DX) {
                throw e;
            } else throw e;
        }
    }
}
