import { millisecondsToMinutes }  from '../../../utils/common';
import { MILLISECONDS_IN_SECOND } from '../../../constants/common';
import { actions, attemptsOptions }                from '../../../config';
import AbstractException          from './AbstractException';

const { resetPassword } = actions;

const codes = Object.fromEntries([
    'DEFAULT',
    'AUTHENTICATION_FAILED',
    'TOKEN_EXPIRED',
    'WRONG_TOKEN',
    'ACCESS_FORBIDDEN',
    'TOO_FREQUENT_RESET_PASSWORD_REQUESTS',
    'WRONG_PASSWORD_RESET_CODE',
    'RESET_PASSWORD_RETRIES_LIMIT_EXCEEDED',
    'HTTP_TOO_MANY_REQUESTS_FOR_LOGIN',
    'INVALID_SERVICE_CREDENTIALS'
].map(v => [ v, v ]));

const defaultError = {
    type    : 'forbidden',
    message : 'Forbidden error'
};
const builders = {
    [codes.DEFAULT] : () => ({
        ...defaultError,
        code : codes.DEFAULT
    }),
    [codes.AUTHENTICATION_FAILED] : () => ({
        ...defaultError,
        code    : codes.AUTHENTICATION_FAILED,
        message : 'Invalid login or password'
    }),
    [codes.TOKEN_EXPIRED] : () => ({
        ...defaultError,
        code    : codes.TOKEN_EXPIRED,
        message : 'Token expired'
    }),
    [codes.WRONG_TOKEN] : () => ({
        ...defaultError,
        code    : codes.WRONG_TOKEN,
        message : 'Wrong token'
    }),
    [codes.ACCESS_FORBIDDEN] : () => ({
        ...defaultError,
        code    : codes.ACCESS_FORBIDDEN,
        message : 'Access forbidden'
    }),
    [codes.TOO_FREQUENT_RESET_PASSWORD_REQUESTS] : ({ interval }) => ({
        ...defaultError,
        code    : codes.TOO_FREQUENT_RESET_PASSWORD_REQUESTS,
        message : `Requests can be sent no more often than the set interval - ${millisecondsToMinutes(interval)} minutes`,
        errors  : []
    }),
    [codes.HTTP_TOO_MANY_REQUESTS_FOR_LOGIN] : () => ({
        ...defaultError,
        code    : codes.HTTP_TOO_MANY_REQUESTS_FOR_LOGIN,
        message : 'You have exceeded the authorization attempt limit and can be repeated after a certain time.',
        errors  : []
    }),
    [codes.WRONG_PASSWORD_RESET_CODE] : () => ({
        ...defaultError,
        code    : codes.WRONG_PASSWORD_RESET_CODE,
        message : 'Wrong password reset code'
    }),
    [codes.RESET_PASSWORD_RETRIES_LIMIT_EXCEEDED] : ({ limit }) => ({
        ...defaultError,
        code    : codes.RESET_PASSWORD_RETRIES_LIMIT_EXCEEDED,
        message : `The limit of ${limit} password reset retries was exceeded`,
        errors  : []
    }),
    [codes.INVALID_SERVICE_CREDENTIALS] : () => ({
        ...defaultError,
        code    : codes.INVALID_SERVICE_CREDENTIALS,
        message : 'Invalid service credentials'
    })
};

const codesWithArgs = {
    [codes.TOO_FREQUENT_RESET_PASSWORD_REQUESTS]  : [ { interval: +resetPassword.interval * MILLISECONDS_IN_SECOND } ],
    [codes.RESET_PASSWORD_RETRIES_LIMIT_EXCEEDED] : [ { limit: +resetPassword.retriesNumberLimit } ],
    [codes.HTTP_TOO_MANY_REQUESTS_FOR_LOGIN]      : [ { limit: +attemptsOptions.attemptsCount } ]
};

export default class ForbiddenError extends AbstractException {
    constructor(code = codes.DEFAULT, payload = {}) {
        super(code, builders[code], payload);
    }
    static codesWithArgs = codesWithArgs;
    static builders = builders;
    static codes = codes;
}

