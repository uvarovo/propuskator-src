import AbstractException from './AbstractException';

const codes = Object.fromEntries([
    'ALREADY_EXISTS',
    'DEFAULT',
    'GROUP_NAME_IS_USED',
    'FORMAT_ERROR',
    'SCHEDULE_NAME_IS_USED',
    'SUBJECT_NAME_IS_USED',
    'SUBJECT_PHONE_IS_USED',
    'SUBJECT_EMAIL_IS_USED',
    'TOKEN_CODE_IS_USED',
    'READER_NAME_IS_USED',
    'READER_CODE_IS_USED',
    'READER_PHONE_IS_USED',
    'WORKSPACE_NAME_IS_USED',
    'ADMIN_LOGIN_IS_USED',
    'WORKSPACE_NOT_FOUND',
    'WRONG_EMAIL_OR_PASSWORD',
    'PASSWORD_IS_ALREADY_IN_USE',
    'ACCESS_IS_TEMPORARILY_DENIED',
    'SUBJECT_NOT_FOUND_IN_WORKSPACE',
    'SUBJECT_EMAIL_IS_ALREADY_REGISTERED',
    'SUBJECT_REGISTRATION_IS_TEMPORARY_UNAVALIABLE',
    'SUBJECT_NOT_PERMITTED_TO_USE_APP',
    'EMAIL_IS_NOT_REGISTERED_IN_WORKSPACE',
    'EMAIL_NOT_FOUND',
    'WRONG_ACTION_TYPE',
    'HTTP_TOO_MANY_REQUESTS_FOR_LOGIN',
    'HTTP_TOO_MANY_REQUESTS_FOR_USER_REGISTRATION',
    'REGISTRATION_REQUEST_NOT_FOUND',
    'REGISTRATION_REQUEST_IN_PROCESSING',
    'REGISTRATION_REQUEST_SUBJECT_EMAIL_IS_ALREADY_REGISTERED',
    'REGISTRATION_REQUEST_SUBJECT_IS_ALREADY_CREATED'
].map(v => [ v, v ]));

const defaultError = {
    type    : 'validation',
    message : 'Validation error',
    errors  : []
};
const builders = {
    [codes.ALREADY_EXISTS] : ({ entityName = 'Entity', fields = [] }) => ({
        ...defaultError,
        code    : codes.ALREADY_EXISTS,
        message : `${entityName} already exists`,
        errors  : fields.map(({ name, value }) => ({
            message : `${entityName} with this ${name} already exists`,
            value
        }))
    }),
    [codes.DEFAULT] : () => ({
        ...defaultError,
        code   : codes.DEFAULT,
        errors : []
    }),
    [codes.GROUP_NAME_IS_USED] : ({ field }) => ({
        ...defaultError,
        code   : codes.GROUP_NAME_IS_USED,
        errors : [ { message: 'Group name is used', field } ]
    }),
    [codes.FORMAT_ERROR] : ({ field }) => ({
        ...defaultError,
        code   : codes.FORMAT_ERROR,
        errors : [ { message: 'Format error', field } ]
    }),
    [codes.SCHEDULE_NAME_IS_USED] : ({ field }) => ({
        ...defaultError,
        code   : codes.SCHEDULE_NAME_IS_USED,
        errors : [ { message: 'Schedule name is used', field } ]
    }),
    [codes.SUBJECT_NAME_IS_USED] : ({ field }) => ({
        ...defaultError,
        code   : codes.SUBJECT_NAME_IS_USED,
        errors : [ { message: 'Subject name is used', field } ]
    }),
    [codes.SUBJECT_PHONE_IS_USED] : ({ field }) => ({
        ...defaultError,
        code   : codes.SUBJECT_PHONE_IS_USED,
        errors : [ { message: 'Subject phone is used', field } ]
    }),
    [codes.SUBJECT_NOT_PERMITTED_TO_USE_APP] : ({ field }) => ({
        ...defaultError,
        code   : codes.SUBJECT_NOT_PERMITTED_TO_USE_APP,
        errors : [ { message: 'Subject not permitted to use app', field } ]
    }),
    [codes.SUBJECT_EMAIL_IS_USED] : ({ field }) => ({
        ...defaultError,
        code   : codes.SUBJECT_EMAIL_IS_USED,
        errors : [ { message: 'Subject email is used', field } ]
    }),
    [codes.TOKEN_CODE_IS_USED] : ({ field }) => ({
        ...defaultError,
        code   : codes.TOKEN_CODE_IS_USED,
        errors : [ { message: 'Tag code is used', field } ]
    }),
    [codes.READER_NAME_IS_USED] : ({ field }) => ({
        ...defaultError,
        code   : codes.READER_NAME_IS_USED,
        errors : [ { message: 'Reader name is used', field } ]
    }),
    [codes.READER_CODE_IS_USED] : ({ field }) => ({
        ...defaultError,
        code   : codes.READER_CODE_IS_USED,
        errors : [ { message: 'Reader ID is used', field } ]
    }),
    [codes.READER_PHONE_IS_USED] : ({ field }) => ({
        ...defaultError,
        code   : codes.READER_PHONE_IS_USED,
        errors : [ { message: 'Reader phone is used', field } ]
    }),
    [codes.WORKSPACE_NAME_IS_USED] : ({ field }) => ({
        ...defaultError,
        code   : codes.WORKSPACE_NAME_IS_USED,
        errors : [ { message: 'Workspace name is used', field } ]
    }),
    [codes.ADMIN_LOGIN_IS_USED] : ({ field }) => ({
        ...defaultError,
        code   : codes.ADMIN_LOGIN_IS_USED,
        errors : [ { message: 'Admin login is used', field } ]
    }),
    [codes.WORKSPACE_NOT_FOUND] : ({ field }) => ({
        ...defaultError,
        code   : codes.WORKSPACE_NOT_FOUND,
        errors : [ { message: 'Workspace not found', field } ]
    }),
    [codes.WRONG_EMAIL_OR_PASSWORD] : () => ({
        ...defaultError,
        code   : codes.WRONG_EMAIL_OR_PASSWORD,
        errors : [
            { message: 'Wrong email or password', field: 'email' },
            { message: 'Wrong email or password', field: 'password' }
        ]
    }),
    [codes.ACCESS_IS_TEMPORARILY_DENIED] : ({ field }) => ({
        ...defaultError,
        code   : codes.ACCESS_IS_TEMPORARILY_DENIED,
        errors : [ { message: 'Access is temporarily denied', field } ]
    }),
    [codes.PASSWORD_IS_ALREADY_IN_USE] : ({ field }) => ({
        ...defaultError,
        code   : codes.PASSWORD_IS_ALREADY_IN_USE,
        errors : [ { message: 'New password is the same as old', field } ]
    }),
    [codes.SUBJECT_NOT_FOUND_IN_WORKSPACE] : ({ field }) => ({
        ...defaultError,
        code   : codes.SUBJECT_NOT_FOUND_IN_WORKSPACE,
        errors : [ { message: 'Email not found in workspace', field } ]
    }),
    [codes.SUBJECT_EMAIL_IS_ALREADY_REGISTERED] : ({ field }) => ({
        ...defaultError,
        code   : codes.SUBJECT_EMAIL_IS_ALREADY_REGISTERED,
        errors : [ { message: 'Email already exists', field } ]
    }),
    [codes.SUBJECT_REGISTRATION_IS_TEMPORARY_UNAVALIABLE] : ({ field }) => ({
        ...defaultError,
        code   : codes.SUBJECT_REGISTRATION_IS_TEMPORARY_UNAVALIABLE,
        errors : [ { message: 'Registration is temporarily unavailable. Ask your administrator', field } ]
    }),
    [codes.EMAIL_IS_NOT_REGISTERED_IN_WORKSPACE] : ({ field }) => ({
        ...defaultError,
        code   : codes.EMAIL_IS_NOT_REGISTERED_IN_WORKSPACE,
        errors : [ { message: 'The email is not registered in the workspace', field } ]
    }),
    [codes.EMAIL_NOT_FOUND] : ({ field }) => ({
        ...defaultError,
        code   : codes.EMAIL_NOT_FOUND,
        errors : [ { message: 'Email not found', field } ]
    }),
    [codes.WRONG_ACTION_TYPE] : ({ type }) => ({
        ...defaultError,
        code   : codes.WRONG_ACTION_TYPE,
        errors : [ { message: 'Wrong action type', value: type } ]
    }),
    [codes.HTTP_TOO_MANY_REQUESTS_FOR_LOGIN] : () => ({
        ...defaultError,
        code    : codes.HTTP_TOO_MANY_REQUESTS_FOR_LOGIN,
        message : 'You have exceeded the authorization attempts limit. Please, repeat after a certain time',
        errors  : []
    }),
    [codes.HTTP_TOO_MANY_REQUESTS_FOR_USER_REGISTRATION] : () => ({
        ...defaultError,
        code    : codes.HTTP_TOO_MANY_REQUESTS_FOR_USER_REGISTRATION,
        message : 'You have exceeded the registration requests limit. Please, repeat after a certain time'
    }),
    [codes.REGISTRATION_REQUEST_NOT_FOUND] : ({ field }) => ({
        ...defaultError,
        code   : codes.REGISTRATION_REQUEST_NOT_FOUND,
        errors : [ { message: 'Registration request not found', field } ]
    }),
    [codes.REGISTRATION_REQUEST_IN_PROCESSING] : () => ({
        ...defaultError,
        code    : codes.REGISTRATION_REQUEST_IN_PROCESSING,
        message : 'Registration request in processing'
    }),
    [codes.REGISTRATION_REQUEST_SUBJECT_EMAIL_IS_ALREADY_REGISTERED] : ({ field }) => ({
        ...defaultError,
        code   : codes.REGISTRATION_REQUEST_SUBJECT_EMAIL_IS_ALREADY_REGISTERED,
        errors : [ { message: 'Email is already registered, try to authorize', field } ]
    }),
    [codes.REGISTRATION_REQUEST_SUBJECT_IS_ALREADY_CREATED] : () => ({
        ...defaultError,
        code    : codes.REGISTRATION_REQUEST_SUBJECT_IS_ALREADY_CREATED,
        message : 'You are already added to the workspace. Please, complete the common registration'
    })
};

const codesWithArgs = {
    [codes.ALREADY_EXISTS] : [
        {
            entityName : 'CameraToReaderMap',
            fields     : [ { name: 'accessTokenReaderId' } ]
        }
    ],
    [codes.GROUP_NAME_IS_USED]                                       : [ { field: 'name' } ],
    [codes.FORMAT_ERROR]                                             : [ { field: 'dates' } ],
    [codes.SCHEDULE_NAME_IS_USED]                                    : [ { field: 'name' } ],
    [codes.SUBJECT_NAME_IS_USED]                                     : [ { field: 'name' } ],
    [codes.SUBJECT_EMAIL_IS_USED]                                    : [ { field: 'email' } ],
    [codes.TOKEN_CODE_IS_USED]                                       : [ { field: 'code' } ],
    [codes.READER_NAME_IS_USED]                                      : [ { field: 'name' } ],
    [codes.READER_CODE_IS_USED]                                      : [ { field: 'code' } ],
    [codes.WORKSPACE_NAME_IS_USED]                                   : [ { field: 'workspace' } ],
    [codes.ADMIN_LOGIN_IS_USED]                                      : [ { field: 'login' } ],
    [codes.WORKSPACE_NOT_FOUND]                                      : [ { field: 'workspace' } ],
    [codes.WRONG_EMAIL_OR_PASSWORD]                                  : [ { field: 'email' } ],
    [codes.ACCESS_IS_TEMPORARILY_DENIED]                             : [ { field: 'workspace' } ],
    [codes.PASSWORD_IS_ALREADY_IN_USE]                               : [ { field: 'password' } ],
    [codes.SUBJECT_NOT_FOUND_IN_WORKSPACE]                           : [ { field: 'email' } ],
    [codes.SUBJECT_EMAIL_IS_ALREADY_REGISTERED]                      : [ { field: 'email' } ],
    [codes.SUBJECT_REGISTRATION_IS_TEMPORARY_UNAVALIABLE]            : [ { field: 'email' } ],
    [codes.SUBJECT_NOT_PERMITTED_TO_USE_APP]                         : [ { field: 'email' } ],
    [codes.EMAIL_IS_NOT_REGISTERED_IN_WORKSPACE]                     : [ { field: 'email' } ],
    [codes.EMAIL_NOT_FOUND]                                          : [ { field: 'login' } ],
    [codes.WRONG_ACTION_TYPE]                                        : [],
    [codes.HTTP_TOO_MANY_REQUESTS_FOR_LOGIN]                         : [],
    [codes.HTTP_TOO_MANY_REQUESTS_FOR_USER_REGISTRATION]             : [],
    [codes.REGISTRATION_REQUEST_NOT_FOUND]                           : [ { field: 'email' } ],
    [codes.REGISTRATION_REQUEST_IS_STILL_PROCESSING]                 : [],
    [codes.REGISTRATION_REQUEST_SUBJECT_EMAIL_IS_ALREADY_REGISTERED] : [ { field: 'email' } ],
    [codes.REGISTRATION_REQUEST_SUBJECT_IS_ALREADY_CREATED]          : []
};

export default class ValidationError extends AbstractException {
    constructor(code = codes.DEFAULT, payload = {}) {
        super(code, builders[code], payload);
    }
    static codesWithArgs = codesWithArgs;
    static builders = builders;
    static codes = codes;
}

