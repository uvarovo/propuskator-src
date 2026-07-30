import sequelize                from '../../../sequelizeSingleton.js';
import Workspace                from '../../../models/Workspace.js';
import UserRegistrationRequest  from '../../../models/UserRegistrationRequest.js';
import Notification             from '../../../models/Notification.js';
import User                     from '../../../models/User.js';
import AccessSubject            from '../../../models/AccessSubject.js';
import { TYPES as ActionTypes } from '../../../constants/storedTriggerableActions.js';
import config                   from '../../../config.js';
import Base                     from '../../Base.js';
import { ValidationError }      from '../../utils/SX/index.js';
import requestLimit             from '../../requestLimit.js';

const USER_REQUESTS_REGISTRATION_ATTEMPTS_COUNT = +config.attemptsOptions.userRegistrationRequests.attemptsCount;

export default class UserCreateRegistrationRequest extends Base {
    // The next rules are based on or equal to same rules in admin/accessSubjects/Create.js and
    // mobile/users/Register.js use cases, because new subject and mobile user will be created
    // based on registration request data(when request will be processed by admin) so its
    // validation must be similar
    static validationRules = {
        // Equal to mobile/users/Register.js "workspace" validation rule
        workspace : [
            'required',
            'string',
            'trim',
            'not_empty',
            { 'fixed_max_length': 50 },
            { 'fixed_min_length': 3 },
            { 'custom_error_code': [ 'WRONG_WORKSPACE_NAME_FORMAT', 'like', '^[a-z0-9]+$' ] }
        ],
        // Equal to admin/accessSubjects/Create.js "name" validation rule
        subjectName : [ 'required', 'string', 'trim', { 'max_length': 255 }, { 'min_length': 1 } ],
        // Based on admin/accessSubjects/Create.js "email" validation rule
        email       : [ 'required', 'string', 'trim', 'fixed_email', { 'max_length': 255 } ],
        // Based on admin/accessSubjects/Create.js "phone" validation rule
        phone       : [ 'string', 'trim', 'phone', { 'max_length': 255 }, { 'default': null } ],
        // Equal to mobile/users/Register.js "password" validation rule
        password    : [
            'required',
            'string',
            'trim',
            'not_empty',
            { 'fixed_max_length': 255 },
            { 'fixed_min_length': 1 },
            'password'
        ],
        // Equal to mobile/users/Register.js "passwordConfirm" validation rule
        passwordConfirm : [ 'required', 'string', 'trim', 'not_empty', { 'equal_to_field': 'password' } ],
        ip              : [ 'required', 'string' ]
    };

    async execute({ workspace: workspaceName, subjectName, email, phone, password, ip }) {
        await this._checkRequestLimit({ ip });

        const workspace = await Workspace.findOne({ where: { name: workspaceName } });

        if (!workspace) throw new ValidationError(ValidationError.codes.WORKSPACE_NOT_FOUND, { field: 'workspace' });

        const user = await User.findOne({ where: { workspaceId: workspace.id, email } });

        if (user) {
            throw new ValidationError(
                ValidationError.codes.REGISTRATION_REQUEST_SUBJECT_EMAIL_IS_ALREADY_REGISTERED,
                { field: 'email' }
            );
        }

        const subject = await AccessSubject.findOne({ where: { workspaceId: workspace.id, email } });

        if (subject) throw new ValidationError(ValidationError.codes.REGISTRATION_REQUEST_SUBJECT_IS_ALREADY_CREATED);

        await sequelize.transaction(async transaction => {
            const existingRegistrationRequest = await UserRegistrationRequest.findOne({
                where : {
                    workspaceId : workspace.id,
                    email
                }
            });

            // Don't use "upsert" method because it will not create custom generated ID as
            // defined in "create" method of Base sequelize model
            if (existingRegistrationRequest) {
                await existingRegistrationRequest.update({
                    subjectName,
                    subjectPhone : phone,
                    password
                }, { transaction });
            } else {
                await UserRegistrationRequest.create({
                    workspaceId  : workspace.id,
                    subjectName,
                    email,
                    subjectPhone : phone,
                    password
                }, { transaction });
            }

            // This data is used to pre-fill fields in access subject creation modal window
            const subjectCreationPrefilledData = {
                subjectName,
                phone,
                email
            };

            // Update all existing notifications for the current email to use actual prefilled data
            // in each modal window for creation subject on registration request
            await Notification.update({
                data : subjectCreationPrefilledData
            }, {
                where : {
                    type : Notification.alwaysEnabledTypes.USER_REQUEST_REGISTRATION,
                    data : { email }
                },
                transaction
            });

            await Notification.create({
                type        : Notification.alwaysEnabledTypes.USER_REQUEST_REGISTRATION,
                message     : `${subjectName} отправил запрос на добавление в рабочее пространство`,
                workspaceId : workspace.id,
                data        : subjectCreationPrefilledData
            }, { transaction });
        });

        return {};
    }

    // Check whether limit of registration requests exceeded
    async _checkRequestLimit({ ip }) {
        const isRequestsLimitExceeded = await requestLimit.checkRequestsFromIPBlocked(
            null,
            ip,
            null,
            ActionTypes.USER_REQUEST_REGISTRATION,
            { attemptsCount: USER_REQUESTS_REGISTRATION_ATTEMPTS_COUNT }
        );

        if (isRequestsLimitExceeded) {
            throw new ValidationError(ValidationError.codes.HTTP_TOO_MANY_REQUESTS_FOR_USER_REGISTRATION);
        }

        await requestLimit.addRequestToAttempts(null, ip, null, ActionTypes.USER_REQUEST_REGISTRATION);
    }
}
