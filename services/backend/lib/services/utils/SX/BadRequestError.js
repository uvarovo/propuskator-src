import AbstractException from './AbstractException';

const codes = Object.fromEntries([
    'DEFAULT',
    'FOREIGN_KEY_CONSTRAINT',
    'UNIQUE_CONSTRAINT',
    'WRONG_OLD_PASSWORD',
    'WRONG_EMAIL'
].map(v => [ v, v ]));

const defaultError = {
    type    : 'badRequest',
    message : 'Bad request'
};

const builders = {
    [codes.DEFAULT] : () => ({
        ...defaultError,
        code : codes.DEFAULT
    }),
    [codes.FOREIGN_KEY_CONSTRAINT] : ({ fields, modelName }) => ({
        ...defaultError,
        code    : codes.FOREIGN_KEY_CONSTRAINT,
        message : `Foreign key constraint error. ${fields.join(', ')} Model: ${modelName}`
    }),
    [codes.UNIQUE_CONSTRAINT] : ({ fields, modelName }) => ({
        ...defaultError,
        code    : codes.UNIQUE_CONSTRAINT,
        message : `Unique constraint error. Fields ${Object.entries(fields).map(([ k, v ]) => `${k}='${v}'`).join(', ')}. Model: ${modelName}`,
        errors  : Object.keys(fields).map(k => {
            return {
                message : `Unique constraint error. Fields: ${k}. Model: ${modelName}`,
                field   : k
            };
        })
    }),
    [codes.WRONG_OLD_PASSWORD] : () => ({
        ...defaultError,
        code    : codes.WRONG_OLD_PASSWORD,
        message : 'Wrong old password',
        errors  : [ { field: 'oldPassword', message: 'Wrong old password' } ]
    }),
    [codes.WRONG_EMAIL] : ({ message }) => ({
        ...defaultError,
        code   : codes.WRONG_EMAIL,
        errors : [ { field: 'email', message } ]
    })
};

const codesWithArgs = {
    [codes.FOREIGN_KEY_CONSTRAINT] : [], // no translations required
    [codes.UNIQUE_CONSTRAINT]      : []  // no translations required
};

export default class BadRequestError extends AbstractException {
    constructor(code = codes.DEFAULT, payload = {}) {
        super(code, builders[code], payload);
    }
    static codesWithArgs = codesWithArgs;
    static builders = builders;
    static codes = codes;
}

