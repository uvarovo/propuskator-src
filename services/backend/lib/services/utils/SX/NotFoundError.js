import AbstractException from './AbstractException';

const codes = Object.fromEntries([
    'DEFAULT',
    'CANNOT_FIND_MODEL',
    'TAG_IS_NOT_FOUND'
].map(v => [ v, v ]));

const defaultError = {
    type    : 'notFound',
    message : 'Not found'
};
const builders = {
    [codes.DEFAULT] : () => ({
        ...defaultError,
        code : codes.DEFAULT
    }),
    [codes.CANNOT_FIND_MODEL] : ({ modelName }) => ({
        ...defaultError,
        code    : codes.CANNOT_FIND_MODEL,
        message : `Cannot find ${modelName}`
    }),
    [codes.TAG_IS_NOT_FOUND] : () => ({
        ...defaultError,
        code    : codes.TAG_IS_NOT_FOUND,
        message : 'Tag is not found'
    })
};

const codesWithArgs = {
    [codes.CANNOT_FIND_MODEL] : [] // no translations required
};

export default class NotFoundError extends AbstractException {
    constructor(code = codes.DEFAULT, payload = {}) {
        super(code, builders[code], payload);
    }
    static codesWithArgs = codesWithArgs;
    static builders = builders;
    static codes = codes;
}

