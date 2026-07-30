/* eslint-disable camelcase */
import Base              from '../../Base';
import AdminUser         from '../../../models/AdminUser';
import { dumpAdminUser } from '../../utils/dumps';
import { BadRequestError, ValidationError } from '../../utils/SX';
import sequelize from '../../../sequelizeSingleton';
import { generateToken } from '../sessions/utils';
import DX from '../../../models/utils/DX';

export default class AdminUserUpdate extends Base {
    validate(data) {
        const rules = {
            // eslint-disable-next-line max-len
            // login       : [ 'string', 'trim', 'not_empty', { 'fixed_max_length': 255 }, { 'fixed_min_length': 1 },  'fixed_email'  ],
            // eslint-disable-next-line camelcase
            newPassword : [ 'string', 'trim', 'not_empty', { 'fixed_max_length': 255 }, 'password', { custom_error_code: [ 'CANNOT_CHANGE_PASSWORD_TO_THE_SAME', 'not_equal_to_field', 'oldPassword' ] } ],
            avatarImg   : [ { 'nested_object' : {
                buffer       : [ 'required' ],
                mimetype     : [ 'required', 'string', { 'one_of': [ 'image/png', 'image/jpg', 'image/jpeg' ] } ],
                originalname : [ 'required', 'string' ]
            } } ]
        };

        if (data.newPassword) {
            rules.passwordConfirm = [ 'required', 'string', 'trim', 'not_empty', { 'equal_to_field': 'newPassword' } ];
            rules.oldPassword = [ 'required', 'string', 'trim', 'not_empty' ];
        }

        return this.doValidation(data, rules);
    }

    // eslint-disable-next-line no-unused-vars
    async execute({ avatarImg, newPassword, oldPassword, passwordConfirm, ...data }) {
        try {
            let dbAdminUser = null;
            const meta = {};

            await sequelize.transaction(async transaction => {
                dbAdminUser = await AdminUser.findByPkOrFail(this.cls.get('userId'), { transaction });
                dbAdminUser.set(data, { transaction });

                if (newPassword) {
                    if (!await dbAdminUser.checkPassword(oldPassword)) {
                        throw new BadRequestError(BadRequestError.codes.WRONG_OLD_PASSWORD);
                    }

                    dbAdminUser.set({
                        password : newPassword
                    }, { transaction });
                }
                await dbAdminUser.save({ transaction });
                await dbAdminUser.reload({ transaction });
            });
            if (avatarImg === '') await dbAdminUser.deleteAvatarImage();
            else if (typeof avatarImg === 'object') await dbAdminUser.setAvatarImage(avatarImg);

            if (newPassword || data.login) {
                meta.newToken = await generateToken(dbAdminUser);
            }

            return {
                data : dumpAdminUser(dbAdminUser),
                meta
            };
        } catch (e) {
            if (e instanceof DX) {
                if (e.modelName === 'MqttUser' && Object.keys(e.fields).length === 1 && Object.keys(e.fields)[0] === 'username') {
                    throw new ValidationError(ValidationError.codes.ADMIN_LOGIN_IS_USED, { field: 'login' });
                } else {
                    throw e;
                }
            } else throw e;
        }
    }
}
