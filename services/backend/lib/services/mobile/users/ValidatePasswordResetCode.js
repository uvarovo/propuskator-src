import Base                                    from '../../Base';
import DX                                      from '../../../models/utils/DX';
import StoredTriggerableAction                 from '../../../models/StoredTriggerableAction';
import User                                    from '../../../models/User';
import { TYPES as ActionTypes }                from '../../../constants/storedTriggerableActions';
import { decodeToken }                         from '../../../utils/jwt';
import { resetPassword as resetPasswordUtils } from './utils';

export default class UserValidatePasswordResetCode extends Base {
    static validationRules = {
        token : [ 'required', 'string', 'trim', 'not_empty' ],
        code  : [ 'required', 'string', 'trim', 'not_empty' ]
    }

    async execute({ token, code }) {
        const { email, workspace: workspaceName } = decodeToken(token);

        const user = await User.findOne({
            where   : { email },
            include : [ { association: User.AssociationWorkspace, where: { name: workspaceName } } ]
        });

        await StoredTriggerableAction.run({
            userId : user.id,
            code
        }, ActionTypes.RESET_USER_PASSWORD);

        try {
            await resetPasswordUtils.validateToken(token, code);

            return {};
        } catch (e) {
            if (e instanceof DX) {
                throw e;
            } else throw e;
        }
    }
}
