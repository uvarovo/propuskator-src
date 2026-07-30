import Base                                    from '../../Base';
import Workspace                               from '../../../models/Workspace';
import User                                    from '../../../models/User';
import AccessSubject                           from '../../../models/AccessSubject';
import StoredTriggerableAction                 from '../../../models/StoredTriggerableAction';
import DX                                      from '../../../models/utils/DX';
import { TYPES as ActionTypes }                from '../../../constants/storedTriggerableActions';
import emailSender                             from '../../emailSenderSingleton';
import { ValidationError }                     from '../../utils/SX';
import { resetPassword as resetPasswordUtils } from './utils';

export default class UserRequestPasswordReset extends Base {
    static validationRules = {
        workspace : [ 'required', 'string', 'trim', 'not_empty' ],
        email     : [ 'required', 'string', 'trim', 'not_empty' ]
    }

    async execute({ workspace, email }) {
        try {
            const dbWorkspace = await Workspace.findOne({ where: { name: workspace } });

            if (!dbWorkspace) {
                throw new ValidationError(ValidationError.codes.WORKSPACE_NOT_FOUND, {
                    field : 'workspace'
                });
            }

            const dbUser = await User.findOne({ where: { email, workspaceId: dbWorkspace.id } });

            const accessSubject = dbUser && await AccessSubject.findOne({
                where : {
                    userId      : dbUser.id,
                    email       : dbUser.email,
                    workspaceId : dbUser.workspaceId
                }
            });

            if (!dbUser) {
                throw new ValidationError(ValidationError.codes.EMAIL_IS_NOT_REGISTERED_IN_WORKSPACE, {
                    field : 'email'
                });
            }

            if (!accessSubject.mobileEnabled || !accessSubject.enabled) {
                throw new ValidationError(ValidationError.codes.ACCESS_IS_TEMPORARILY_DENIED, {
                    field : 'workspace'
                });
            }

            const resetPasswordCode = resetPasswordUtils.generateCode();

            await StoredTriggerableAction.create({
                type    : ActionTypes.RESET_USER_PASSWORD,
                userId  : dbUser.id,
                payload : { retriesNumber: 0, code: resetPasswordCode }
            });

            await emailSender.send('RESET_PASSWORD_WITH_CODE', dbUser.email, {
                resetPasswordCode
            });

            // TODO: add actionId to token's payload to simplify action auth in other reset password services
            return {
                data : {
                    passwordResetTokentoken : resetPasswordUtils.generateToken(dbWorkspace, dbUser, resetPasswordCode)
                }
            };
        } catch (e) {
            if (e instanceof DX) {
                throw e;
            } else throw e;
        }
    }
}
