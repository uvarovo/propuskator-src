import sequelize                            from '../../../sequelizeSingleton.js';
import DX                                   from '../../../models/utils/DX.js';
import AccessSubject                        from '../../../models/AccessSubject.js';
import UserRegistrationRequest              from '../../../models/UserRegistrationRequest.js';
import User                                 from '../../../models/User.js';
import Workspace                            from '../../../models/Workspace.js';
import Notification                         from '../../../models/Notification.js';
import Base                                 from '../../Base.js';
import getRandomColor                       from '../../utils/colors.js';
import { dumpAccessSubject }                from '../../utils/dumps.js';
import { ValidationError, BadRequestError } from '../../utils/SX/index.js';
import checkPhoneIsUnique                   from './utils/checkPhoneIsUnique.js';
import { sendInviteForUserAuthorization }   from './utils/emailSending.js';

// This class is mainly based on services/admin/accessSubjects/Create.js,
// because the flow is very similar exepting of mobile user creation and sending authorization
// link in invitation email
export default class AccessSubjectCreateOnRequest extends Base {
    validate(data) {
        const rules = {
            name      : [ 'required', 'string', 'trim', { 'max_length': 255 }, { 'min_length': 1 } ],
            position  : [ 'string', 'trim', { 'max_length': 255 }, { 'default': null } ],
            email     : [ 'string', 'trim', 'fixed_email', { 'max_length': 255 }, { 'default': null } ],
            phone     : [ 'string', 'trim', 'phone', { 'max_length': 255 }, { 'default': null } ],
            avatarImg : [ { 'nested_object' : {
                buffer   : [ 'required' ],
                mimetype : [
                    'required',
                    'string',
                    'trim',
                    { 'one_of': [ 'image/png', 'image/jpg', 'image/jpeg' ] }
                ],
                originalname : [ 'required', 'string', 'trim' ]
            } } ],
            mobileEnabled         : [ 'boolean', { 'default': true } ],
            phoneEnabled          : [ 'boolean', { 'default': false } ],
            accessSubjectTokenIds : [ { 'list_of': 'db_id' }, 'list_items_unique', 'filter_empty_values' ],
            sendInvitation        : [ 'boolean', { 'default': false } ],
            canAttachTokens       : [ 'boolean', { 'default': false } ]
        };

        if (
            data.mobileEnabled === true ||
            data.mobileEnabled === 'true' ||
            data.mobileEnabled === null ||
            data.mobileEnabled === undefined
        ) {
            rules.email = [ 'required', ...rules.email ];
        }
        if (data.phoneEnabled === true || data.phoneEnabled === 'true') rules.phone = [ 'required', ...rules.phone ];

        return this.doValidation(data, rules);
    }

    async execute({ accessSubjectTokenIds, sendInvitation, avatarImg, ...data }) {
        try {
            const existingAccessSubject = await AccessSubject.findOne({ where: { email: data.email } });

            if (existingAccessSubject) {
                throw new ValidationError(ValidationError.codes.SUBJECT_EMAIL_IS_USED, { field: 'email' });
            }

            const [ registrationRequest ] = await UserRegistrationRequest.findAll({
                where : { email: data.email },
                order : [ [ 'createdAt', 'DESC' ] ]
            });

            if (!registrationRequest) {
                throw new ValidationError(ValidationError.codes.REGISTRATION_REQUEST_NOT_FOUND, { field: 'email' });
            }

            const isPhoneUnique = await checkPhoneIsUnique({
                workspaceId : this.cls.get('workspaceId'),
                phone       : data.phone
            });

            if (!isPhoneUnique) {
                throw new ValidationError(ValidationError.codes.SUBJECT_PHONE_IS_USED, { field: 'phone' });
            }

            let accessSubject = null;

            await sequelize.transaction(async transaction => {
                accessSubject = await this._createSubject({ accessSubjectTokenIds, sendInvitation, data }, transaction);

                if (accessSubject.mobileEnabled) {
                    const user = await this._createMobileUser({
                        // Create user with email that was entered by admin(for case when admin changed it)
                        email        : data.email,
                        passwordHash : registrationRequest.passwordHash,
                        workspaceId  : registrationRequest.workspaceId
                    }, transaction);

                    await accessSubject.update({ userId: user.id }, { transaction });
                }

                await UserRegistrationRequest.destroy({ where: { email: data.email }, transaction });
            });

            if (avatarImg) await accessSubject.setAvatarImage(avatarImg);

            let invitationSentSuccessfully = true;

            if (sendInvitation) {
                try {
                    const workspace = await Workspace.findOne({ where: { id: registrationRequest.workspaceId } });

                    await sendInviteForUserAuthorization({ email: data.email, workspaceName: workspace.name });
                } catch (err) {
                    this.logger.warn(`Error with sending email: ${err.message}`);

                    invitationSentSuccessfully = false;
                }
            }

            return {
                data : dumpAccessSubject(accessSubject),
                meta : {
                    invitationSentSuccessfully : sendInvitation ? invitationSentSuccessfully : undefined
                }
            };
        } catch (e) {
            if (e instanceof DX) {
                if (e instanceof DX.ForeignKeyConstraintError) {
                    throw new BadRequestError(BadRequestError.codes.FOREIGN_KEY_CONSTRAINT, {
                        fields : e.fields, modelName : e.modelName
                    });
                } else if (e instanceof DX.UniqueConstraintError) {
                    if (
                        e.modelName === 'AccessSubject' &&
                        Object.keys(e.fields).length === 1 &&
                        Object.keys(e.fields)[0] === 'AccessSubjects_workspaceId_name_deletedAt_uk'
                    ) {
                        throw new ValidationError(ValidationError.codes.SUBJECT_NAME_IS_USED, { field: 'name' });
                    }
                } else throw e;
            } else throw e;
        }
    }

    async _createSubject({ accessSubjectTokenIds, sendInvitation, data }, transaction) {
        const subject = await AccessSubject.create({
            ...data,
            isInvited   : sendInvitation,
            avatarColor : getRandomColor()
        }, { transaction });

        if (accessSubjectTokenIds?.length) {
            await subject.setAccessSubjectTokens(accessSubjectTokenIds, { transaction });
        }

        await subject.reload({
            include : [ { association: AccessSubject.AssociationAccessSubjectTokens, required: false } ],
            transaction
        });

        await Notification.update({
            accessSubjectId : subject.id
        }, {
            where : {
                type            : Notification.alwaysEnabledTypes.USER_REQUEST_REGISTRATION,
                accessSubjectId : null,
                data            : { email: subject.email }
            },
            transaction
        });

        return subject;
    }

    async _createMobileUser({ email, passwordHash, workspaceId, data }, transaction) {
        const deletedUser = await User.findOne({
            where    : { email, workspaceId },
            paranoid : false
        });

        if (deletedUser) {
            await deletedUser.restore({ transaction });
            await deletedUser.update({ passwordHash }, { transaction });

            return deletedUser;
        }

        const user = await User.create({
            email,
            passwordHash,
            ...data,
            workspaceId
        }, { transaction });

        return user;
    }
}
