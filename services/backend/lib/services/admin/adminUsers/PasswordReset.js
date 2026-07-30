import sequelize                               from '../../../sequelizeSingleton';
import StoredTriggerableAction                 from '../../../models/StoredTriggerableAction';
import { TYPES as ActionTypes }                from '../../../constants/storedTriggerableActions';
import DX                                      from '../../../models/utils/DX';
import { ValidationError, NotFoundError }      from '../../utils/SX';
import Base                                    from '../../Base';
import sessionsUtils                           from '../sessions/utils';
import { resetPassword as resetPasswordUtils } from './utils';

export default class AdminUserPasswordReset extends Base {
    static validationRules = {
        token    : [ 'required', 'string', 'trim', 'not_empty' ],
        password : [ 'required', 'string', 'trim', 'not_empty',
            { 'fixed_max_length': 255 },
            { 'fixed_min_length': 1 },
            'password'
        ],
        passwordConfirm : [ 'required', 'string', 'trim', 'not_empty', { 'equal_to_field': 'password' } ]
    }

    // eslint-disable-next-line no-unused-vars
    async execute({ token, password }) {
        const transaction = await sequelize.transaction();

        try {
            const [ { actionId }, dbAdminUser ] =  await resetPasswordUtils.validateToken(token);

            if (await dbAdminUser.checkPassword(password)) {
                throw new ValidationError(ValidationError.codes.PASSWORD_IS_ALREADY_IN_USE, { field: 'password' });
            }

            const action = await StoredTriggerableAction.findOne({
                where : {
                    id          : actionId,
                    adminUserId : dbAdminUser.id,
                    type        : ActionTypes.RESET_ADMIN_PASSWORD
                },
                order : [ [ 'createdAt', 'DESC' ] ]
            });

            if (!action) {
                throw new NotFoundError(NotFoundError.codes.CANNOT_FIND_MODEL, {
                    modelName : 'StoredTriggerableAction'
                });
            }

            await action.runAndDelete();
            dbAdminUser.set({ password }, { transaction });
            await dbAdminUser.save({ transaction });
            await dbAdminUser.reload({ transaction });

            await transaction.commit();

            return {
                meta : {
                    newToken : await sessionsUtils.generateToken(dbAdminUser)
                }
            };
        } catch (e) {
            await transaction.rollback();

            if (e instanceof DX) {
                throw e;
            } else throw e;
        }
    }
}
