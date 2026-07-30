import sequelize                               from '../../../sequelizeSingleton';
import StoredTriggerableAction                 from '../../../models/StoredTriggerableAction';
import User                                    from '../../../models/User';
import AccessSubject                           from '../../../models/AccessSubject';
import DX                                      from '../../../models/utils/DX';
import { TYPES as ActionTypes }                from '../../../constants/storedTriggerableActions';
import { decodeToken }                         from '../../../utils/jwt';
import Base                                    from '../../Base';
import { ValidationError }                     from '../../utils/SX';
import sessionsUtils                           from '../sessions/utils';
import { dumpMobileAccessSubject }             from '../../utils/dumps';
import { resetPassword as resetPasswordUtils } from './utils';

export default class UserPasswordReset extends Base {
    static validationRules = {
        token           : [ 'required', 'string', 'trim', 'not_empty' ],
        code            : [ 'required', 'string', 'trim', 'not_empty' ],
        password        : [ 'required', 'string', 'trim', 'not_empty', { 'fixed_max_length': 255 }, { 'fixed_min_length': 1 }, 'password' ],
        passwordConfirm : [ 'required', 'string', 'trim', 'not_empty', { 'equal_to_field': 'password' } ]
    }

    async execute({ token, code, password }) {
        const { email, workspace: workspaceName } = decodeToken(token);

        const user = await User.findOne({
            where   : { email },
            include : [ { association: User.AssociationWorkspace, where: { name: workspaceName } } ]
        });
        const accessSubject = await AccessSubject.findOne({
            where : {
                userId : user.id
            }
        });

        const targetAction = await StoredTriggerableAction.run({
            userId : user.id,
            code
        }, ActionTypes.RESET_USER_PASSWORD);

        try {
            let dbUser;

            await sequelize.transaction(async transaction => {
                [ ,, dbUser ] =  await resetPasswordUtils.validateToken(token, code);

                if (await dbUser.checkPassword(password)) {
                    throw new ValidationError(ValidationError.codes.PASSWORD_IS_ALREADY_IN_USE, { field: 'password' });
                }

                await targetAction.runAndDelete();
                dbUser.set({ password }, { transaction });
                await dbUser.save({ transaction });
                await dbUser.reload({ transaction });
            });

            return {
                data : {
                    accessSubject : await dumpMobileAccessSubject(accessSubject)
                },
                meta : {
                    newToken : await sessionsUtils.generateToken(dbUser)
                }
            };
        } catch (e) {
            if (e instanceof DX) {
                throw e;
            } else throw e;
        }
    }
}
