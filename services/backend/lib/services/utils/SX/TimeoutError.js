import AbstractException from './AbstractException';

const codes = Object.fromEntries([
    'DEFAULT',
    'TIMEOUT'
].map(v => [ v, v ]));

const defaultError = {
    type    : 'timeout',
    message : 'Timed out'
};
const builders = {
    [codes.DEFAULT] : () => ({
        ...defaultError,
        code : codes.DEFAULT
    }),
    [codes.TIMEOUT] : () => ({
        ...defaultError,
        code    : codes.TIMEOUT,
        message : 'Timed out'
    })
};

export default class TimeoutError extends AbstractException {
    constructor(code = codes.DEFAULT, payload = {}) {
        super(code, builders[code], payload);
    }
    static builders = builders;
    static codes = codes;
}

