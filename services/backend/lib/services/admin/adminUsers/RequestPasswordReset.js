import Base                                    from '../../Base';
import AdminUser                               from '../../../models/AdminUser';
import StoredTriggerableAction                 from '../../../models/StoredTriggerableAction';
import DX                                      from '../../../models/utils/DX';
import { TYPES as ActionTypes }                from '../../../constants/storedTriggerableActions';
import emailSender                             from '../../emailSenderSingleton';
import { ValidationError }                     from '../../utils/SX';
import { resetPassword as resetPasswordUtils } from './utils';

export default class AdminUserRequestPasswordReset extends Base {
    static validationRules = {
        login : [ 'required', 'string', 'trim', 'not_empty' ]
    }

    async execute({ login }) {
        try {
            const dbAdminUser = await AdminUser.findOne({ where: { login } });

            if (!dbAdminUser || (dbAdminUser.login !== login)) {
                throw new ValidationError(ValidationError.codes.EMAIL_NOT_FOUND, { field: 'login' });
            }

            const action = await StoredTriggerableAction.create({
                adminUserId : dbAdminUser.id,
                type        : ActionTypes.RESET_ADMIN_PASSWORD
            });

            const resetPasswordToken = resetPasswordUtils.generateToken(dbAdminUser, action.id);

            this.cls.set('resetPasswordToken', resetPasswordToken); // for testing

            await emailSender.send('RESET_PASSWORD_WITH_URL', dbAdminUser.login, {
                // eslint-disable-next-line max-len
                resetPasswordToken
                // operatingSystem    : useragent.os,
                // browserName        : useragent.browser
            });

            return {};
        } catch (e) {
            if (e instanceof DX) {
                throw e;
            } else throw e;
        }
    }
}
