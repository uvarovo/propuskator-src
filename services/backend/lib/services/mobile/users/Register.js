/* eslint-disable max-len */
import Base from '../../Base';
import User from '../../../models/User';
import Notification from '../../../models/Notification';
import AccessSubject from '../../../models/AccessSubject';
import Workspace from '../../../models/Workspace';
import { dumpUser, dumpMobileAccessSubject } from '../../utils/dumps';
import sequelize from '../../../sequelizeSingleton';
import { generateToken } from '../sessions/utils';
import DX from '../../../models/utils/DX';
import { ValidationError } from '../../utils/SX';

export default class UserRegister extends Base {
    static validationRules = {
        workspace       : [ 'required', 'string', 'trim', 'not_empty', { 'fixed_max_length': 50 }, { 'fixed_min_length': 3 },  { 'custom_error_code': [ 'WRONG_WORKSPACE_NAME_FORMAT', 'like', '^[a-z0-9]+$' ] }  ],
        email           : [ 'required', 'string', 'trim', 'not_empty', { 'fixed_max_length': 255 }, { 'fixed_min_length': 1 },  'fixed_email' ],
        // login           : [ 'string', 'trim', 'not_empty', { 'fixed_max_length': 255 }, { 'fixed_min_length': 1 },  { 'custom_error_code': [ 'WRONG_LOGIN_FORMAT', 'like', '^[a-zA-Z0-9_]+$' ] }  ],
        password        : [ 'required', 'string', 'trim', 'not_empty', { 'fixed_max_length': 255 }, { 'fixed_min_length': 1 }, 'password' ],
        passwordConfirm : [ 'required', 'string', 'trim', 'not_empty', { 'equal_to_field': 'password' } ]
    }

    async execute({ workspace, email, ...data }) {
        try {
            let dbUser = null;

            let accessSubject = null;

            await sequelize.transaction(async transaction => {
                const dbWorkspace = await Workspace.findOne({ where: { name: workspace } });

                if (!dbWorkspace)  throw new ValidationError(ValidationError.codes.WORKSPACE_NOT_FOUND, { field: 'workspace' });

                accessSubject = await AccessSubject.findOne({
                    where : {
                        email,
                        workspaceId : dbWorkspace.id
                        // mobileEnabled : true,
                        // enabled       : true,
                        // userId        : null
                    }
                });
                const deletedUser = await this._getDeletedUser(email, dbWorkspace.id);

                if (!accessSubject)  throw new ValidationError(ValidationError.codes.SUBJECT_NOT_FOUND_IN_WORKSPACE, { field: 'email' });

                if (accessSubject.userId !== null && !deletedUser) throw new ValidationError(ValidationError.codes.SUBJECT_EMAIL_IS_ALREADY_REGISTERED, { field: 'email' });

                if (!accessSubject.mobileEnabled || !accessSubject.enabled)  throw new ValidationError(ValidationError.codes.SUBJECT_REGISTRATION_IS_TEMPORARY_UNAVALIABLE, { field: 'email' });

                if (deletedUser) {
                    dbUser = await this._restoreUser(deletedUser, data.password, transaction);
                } else {
                    dbUser = await User.create({
                        email,
                        ...data,
                        workspaceId : dbWorkspace.id
                    }, { transaction });
                }

                await accessSubject.update({
                    userId : dbUser.id
                }, { transaction });

                await dbUser.reload({ transaction });
                await this._sendNotification(accessSubject, transaction);
            });

            return {
                data : {
                    email         : dbUser.email, // for backward compatibility with mobile app
                    user          : dumpUser(dbUser),
                    accessSubject : await dumpMobileAccessSubject(accessSubject)
                },
                meta : {
                    token : await generateToken(dbUser)
                }
            };
        } catch (e) {
            if (e instanceof DX) {
                throw e;
            } else throw e;
        }
    }

    async _getDeletedUser(email, workspaceId) {
        return User.findOne({
            where : {
                email,
                workspaceId,
                deletedAt : { [sequelize.Op.ne]: null }
            },
            paranoid : false
        });
    }

    async _restoreUser(user, password, transaction) {
        await user.restore();

        return user.update({ password }, { transaction });
    }

    async _sendNotification(accessSubject, transaction) {
        return Notification.create({
            type            : Notification.types.USER_ACTIONS.ACCESS_SUBJECT_REGISTRATION,
            message         : `Субъект ${accessSubject.name} зарегистрировался в приложении`,
            workspaceId     : accessSubject.workspaceId,
            accessSubjectId : accessSubject.id
        }, { transaction });
    }
}
