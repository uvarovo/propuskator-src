/* eslint-disable camelcase */
import Base              from '../../Base';
import User         from '../../../models/User';
import { dumpUser } from '../../utils/dumps';
import { BadRequestError } from '../../utils/SX';
import sequelize from '../../../sequelizeSingleton';
import { generateToken } from '../sessions/utils';
import DX from '../../../models/utils/DX';

export default class UserUpdate extends Base {
    validate(data) {
        const rules = {
            // eslint-disable-next-line camelcase
            newPassword : [ 'string', 'trim', 'not_empty', { 'fixed_max_length': 255 }, 'password', { custom_error_code: [ 'CANNOT_CHANGE_PASSWORD_TO_THE_SAME', 'not_equal_to_field', 'oldPassword' ] } ]
        };

        if (data.newPassword) {
            rules.passwordConfirm = [ 'required', 'string', 'trim', 'not_empty', { 'equal_to_field': 'newPassword' } ];
            rules.oldPassword = [ 'required', 'string', 'trim', 'not_empty' ];
        }

        return this.doValidation(data, rules);
    }

    async execute({ newPassword, oldPassword, ...data }) {
        try {
            let dbUser = null;
            const meta = {};

            await sequelize.transaction(async transaction => {
                dbUser = await User.findByPkOrFail(this.cls.get('userId'), { transaction });

                if (newPassword) {
                    if (!await dbUser.checkPassword(oldPassword)) {
                        throw new BadRequestError(BadRequestError.codes.WRONG_OLD_PASSWORD);
                    }

                    dbUser.set({
                        password : newPassword
                    }, { transaction });
                }
                await dbUser.save({ transaction });
                await dbUser.reload({ transaction });
            });

            if (newPassword || data.login) {
                meta.newToken = await generateToken(dbUser);
            }

            return {
                data : dumpUser(dbUser),
                meta
            };
        } catch (e) {
            if (e instanceof DX) {
                throw e;
            } else throw e;
        }
    }
}
