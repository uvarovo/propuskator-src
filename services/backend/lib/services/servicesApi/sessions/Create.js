import Base         from '../../Base';
import { ForbiddenError, ValidationError } from '../../utils/SX';
import { tokens } from '../../../config';
import { generateToken } from './utils';

export default class SessionCreate extends Base {
    static validationRules = {
        type    : [ 'required', 'string' ],
        token   : [ 'required', 'string' ],
        payload : [ 'required', 'any_object' ]
    };

    async execute({ type, token, payload }) {
        const servicesTokens = tokens.servicesTokens;

        if (token !== servicesTokens[type]) {
            throw new ForbiddenError(ForbiddenError.codes.INVALID_SERVICE_CREDENTIALS);
        }

        if (!payload.hasOwnProperty('workspace')) {
            throw new ValidationError(ValidationError.codes.WORKSPACE_NOT_FOUND, { field: 'workspace' });
        }

        const jwtToken = await generateToken({ type, payload }, token);

        return {
            data : {
                jwt : jwtToken
            }
        };
    }
}
