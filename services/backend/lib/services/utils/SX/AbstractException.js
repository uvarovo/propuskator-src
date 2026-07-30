import { initLogger } from '../../../extensions/Logger';

const logger = initLogger('Exception');

export default class AbstractException extends Error {
    constructor(origCode, builder, payload = {}) {
        if (builder) {
            logger.error(`ERROR WITH CODE ${origCode} IS NOT HANDLED`);
            logger.error(payload);
        }
        const { type, message, errors, code } = builder ? builder(payload) : {
            type    : 'unknownError',
            message : payload.message || 'Please, contact your system administrator!',
            errors  : payload.errors || []
        };

        super(message);
        this.type = type;
        if (code) this.code = code;
        this.message = message;
        if (errors) this.errors = errors;
    }
}
