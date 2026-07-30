/* eslint-disable no-ex-assign */
import dotProp        from 'dot-prop';
import ChistaException from 'chista/Exception';
import { initLogger } from '../extensions/Logger';
import formatChistaValidationError from '../services/utils/chistaValidationErrorFormatter';
import { hideSensitiveData } from '../utils/hideSensitiveData';
import { errorHandler } from './errorHandler';

// TODO: implement response with one structure to prevent errors with broken JSON on the client side:
// {
//     status, - string, status of the response (0 - success|1 - error)
//     data    - object, data of the response
// }
function defaultReponseBuilder(req, res, next, result) {
    if (typeof result === 'object') res.send({ status: 1, ...result });
    else res.send(result);
}

function defaultParamBuilber(req) {
    return {  ...req.params, ...req.query, ...req.body };
}

export function makeServiceRunner(
    serviceClass,
    paramBuilder = defaultParamBuilber,
    responseBuilder = defaultReponseBuilder
) {
    return async (req, res, next) => {
        const params = paramBuilder(req);
        const context = dotProp.get(req, 'session.context', {});
        const service = new serviceClass({ context });
        const verboseTypes = service.constructor.verboseTypes;
        const logger = initLogger(service.constructor.name);

        service.logger = logger;

        try {
            // This added to reduse logs from some services used with polling requests
            if (!verboseTypes || (!verboseTypes.silenced && verboseTypes.params)) {
                logger.info(`RUNNING SERVICE ${ serviceClass.name }`);
                logger.info(`WITH PARAMS ${ JSON.stringify(hideSensitiveData(params)) }`);
            }

            const result = await service.run(params);

            if (!verboseTypes || (!verboseTypes.silenced && verboseTypes.result)) {
                logger.debug(`RESULT: ${result && JSON.stringify(result)}`);
            }

            return responseBuilder(req, res, next, result);
        } catch (error) {
            if (process.env.MODE === 'application') console.log(error);

            logger.error(error);
            if (error instanceof ChistaException && error.code === 'FORMAT_ERROR') {
                error = formatChistaValidationError(error);
            }

            return errorHandler(error, req, res);
        }
    };
}
