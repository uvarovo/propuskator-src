/* eslint-disable no-param-reassign */

import dotProp from 'dot-prop';
import localizator           from '../utils/localization';
import * as SX from '../services/utils/SX';

// eslint-disable-next-line no-unused-vars
export function errorHandler(error, req, res, next) {
    const locale =
        dotProp.get(req, 'headers.accept-language', 'en')
        || dotProp.get(req, 'session.context.localization', 'en');

    let statusCode = 500;

    if (error instanceof SX.NotFoundError) statusCode = 404;
    else if (error instanceof SX.ForbiddenError) statusCode = 403;
    else if (error instanceof SX.ValidationError) statusCode = 412;
    else if (error instanceof SX.BadRequestError) statusCode = 400;

    res.status(statusCode);

    let err = dumpError(error);

    if (!req.disableTranslate) err = localizeError(err, locale);

    res.send({ status: 0, ...err });
}

function localizeError(err, locale) {
    if (err.message) err.message = localizator.l(err.message, locale);
    if (err.errors) {
        err.errors.forEach(e => {
            if (e.message) e.message = localizator.l(e.message, locale);
        });
    }

    return err;
}

function dumpError(error) {
    const errObj = {
        type   : error.type || 'SERVER_ERROR',
        code   : error.code,
        errors : (error instanceof SX.default) ? error.errors : []
    };

    if (!errObj.errors || !errObj.errors.length) {
        errObj.message = error instanceof SX.default ? error.message : 'Please, contact your system administrator!';
    }

    return errObj;
}
