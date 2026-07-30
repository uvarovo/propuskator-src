import AbstractException from './AbstractException';

const codes = Object.fromEntries([
    'DEFAULT',
    'OPEN_DOOR_ERROR'
].map(v => [ v, v ]));

const defaultError = {
    type    : 'openDoorError',
    message : 'Open door error'
};
const builders = {
    [codes.DEFAULT] : () => ({
        ...defaultError,
        code : codes.DEFAULT
    }),
    [codes.OPEN_DOOR_ERROR] : () => ({
        ...defaultError,
        code    : codes.OPEN_DOOR_ERROR,
        message : 'Open door error'
    })
};

export default class OpenDoorError extends AbstractException {
    constructor(code = codes.DEFAULT, payload = {}) {
        super(code, builders[code], payload);
    }
    static builders = builders;
    static codes = codes;
}

