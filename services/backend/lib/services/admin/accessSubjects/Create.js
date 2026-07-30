import Base                  from '../../Base';
import AccessSubject         from '../../../models/AccessSubject';
import Workspace             from '../../../models/Workspace';
import getRandomColor        from '../../utils/colors';
import { dumpAccessSubject } from '../../utils/dumps';
import sequelize             from '../../../sequelizeSingleton';
import DX                    from '../../../models/utils/DX';
import { BadRequestError, ValidationError } from '../../utils/SX';
import sendInvitationEmail                  from './utils/sendInvitationEmail';
import checkPhoneIsUnique                   from './utils/checkPhoneIsUnique';

export default class AccessSubjectCreate extends Base {
    validate(data) {
        const rules = {
            name      : [ 'required', 'string', 'trim', { 'max_length': 255 }, { 'min_length': 1 } ],
            position  : [ 'string', 'trim', { 'max_length': 255 }, { 'default': null } ],
            email     : [ 'string', 'trim', 'fixed_email', { 'max_length': 255 }, { 'default': null } ],
            phone     : [ 'string', 'trim', 'phone', { 'max_length': 255 }, { 'default': null } ],
            avatarImg : [ { 'nested_object' : {
                buffer       : [ 'required' ],
                mimetype     : [ 'required', 'string', 'trim', { 'one_of': [ 'image/png', 'image/jpg', 'image/jpeg' ] } ],
                originalname : [ 'required', 'string', 'trim' ]
            } } ],
            mobileEnabled         : [ 'boolean', { 'default': true } ],
            phoneEnabled          : [ 'boolean', { 'default': false } ],
            accessSubjectTokenIds : [ { 'list_of': 'db_id' }, 'list_items_unique', 'filter_empty_values' ],
            sendInvitation        : [ 'boolean', { 'default': false } ],
            canAttachTokens       : [ 'boolean', { 'default': false } ]
        };

        if (data.mobileEnabled === true || data.mobileEnabled === 'true' || data.mobileEnabled === null || data.mobileEnabled === undefined) {
            // rules.email = [ { 'custom_error_code': [ 'REQUIRED_EMAIL_ON_MOBILE', 'required' ] }, ...rules.email ];
            rules.email = [ 'required', ...rules.email ];
        }
        if (data.phoneEnabled === true || data.phoneEnabled === 'true') rules.phone = [ 'required', ...rules.phone ];

        return this.doValidation(data, rules);
    }

    async execute({ accessSubjectTokenIds, sendInvitation, avatarImg, ...data }) {
        try {
            const isPhoneUnique = await checkPhoneIsUnique({ workspaceId: this.cls.get('workspaceId'), phone: data.phone });

            if (!isPhoneUnique) throw new ValidationError(ValidationError.codes.SUBJECT_PHONE_IS_USED, { field: 'phone' });

            let accessSubject = null;

            await sequelize.transaction(async transaction => {
                accessSubject = await AccessSubject.create({
                    ...data,
                    isInvited   : sendInvitation,
                    avatarColor : getRandomColor()
                }, { transaction });
                if (accessSubjectTokenIds) {
                    // eslint-disable-next-line no-param-reassign
                    accessSubjectTokenIds = accessSubjectTokenIds.filter(v => v);
                    await accessSubject.setAccessSubjectTokens(accessSubjectTokenIds, { transaction });
                }
                await accessSubject.reload({
                    include : [ { association: AccessSubject.AssociationAccessSubjectTokens, required: false } ],
                    transaction
                });
            });
            if (avatarImg) {
                await accessSubject.setAvatarImage(avatarImg);
            }

            let invitationSentSuccessfully = true;

            if (sendInvitation) {
                try {
                    await this._sendInviteEmail(accessSubject);
                } catch (err) {
                    this.logger.warn(`Error with sending email: ${err.message}`);

                    invitationSentSuccessfully = false;
                }
            }

            return {
                data : dumpAccessSubject(accessSubject),
                meta : {
                    invitationSentSuccessfully
                }
            };
        } catch (e) {
            if (e instanceof DX) {
                if (e instanceof DX.ForeignKeyConstraintError) {
                    throw new BadRequestError(BadRequestError.codes.FOREIGN_KEY_CONSTRAINT, {
                        fields : e.fields, modelName : e.modelName
                    });
                } else if (e instanceof DX.UniqueConstraintError) {
                    if (e.modelName === 'AccessSubject' && Object.keys(e.fields).length === 1 && Object.keys(e.fields)[0] === 'AccessSubjects_workspaceId_name_deletedAt_uk') {
                        throw new ValidationError(ValidationError.codes.SUBJECT_NAME_IS_USED, { field: 'name' });
                    } else if (e.modelName === 'AccessSubject' && Object.keys(e.fields).length === 1 && Object.keys(e.fields)[0] === 'AccessSubjects_workspaceId_email_deletedAt_uk') {
                        throw new ValidationError(ValidationError.codes.SUBJECT_EMAIL_IS_USED, { field: 'email' });
                    } else {
                        throw e;
                    }
                } else throw e;
            } else throw e;
        }
    }

    async _sendInviteEmail(accessSubject) {
        if (!accessSubject.mobileEnabled) return;

        const { email, workspaceId } = accessSubject;
        const workspace = await Workspace.findOne({ where: { id: workspaceId } });

        await sendInvitationEmail({ email, workspace });
    }
}
