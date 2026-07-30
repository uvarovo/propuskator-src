/* eslint-disable no-param-reassign */
/* eslint-disable camelcase */
import { URL }          from 'url';
import LIVR, { util }         from 'livr';
import uuidValidate from 'uuid-validate';
import extraRules   from 'livr-extra-rules';
import moment       from 'moment';
// import phone     from 'phone';
import uniquBy      from 'lodash/uniqBy';

const defaultRules = {
    ...extraRules,
    'uuid'() {
        return value => {
            if (uuidValidate(value, 4)) return;

            if (value === undefined || value === null || value === '') return;
            if (typeof value !== 'string') return 'FORMAT_ERROR';
            if (value.length < 24) return 'WRONG_ID';
            if (value.length > 24) return 'WRONG_ID';
            if (value.match(/[^a-f0-9]/)) return 'WRONG_ID';
        };
    },

    'future_date'() {
        return value => {
            if (value === undefined || value === null || value === '') return;
            const valueDate = new Date(value);

            valueDate.setTime(valueDate.getTime() + valueDate.getTimezoneOffset() * 60 * 1000);
            if (valueDate - new Date() < 0) return 'WRONG_DATE';

            return;
        };
    },

    'date_after_field'(field) {
        return (value, data) => {
            if (!value || !data[field]) return;
            if (moment(value).isSameOrBefore(moment(data[field]))) return 'WRONG_END_OF_DATE_RANGE';

            return;
        };
    },

    'is_date'() {
        return value => {
            if (value === undefined || value === null || value === '') return;
            const valueDate = moment(value, 'YYYY-MM-DD[T]HH:mm:ss.SSSZZ', true);

            if (!valueDate.isValid()) return 'WRONG_DATE';

            return;
        };
    },

    'password'() {
        return value => {
            if (value) {
                if (!value) return 'WRONG_PASSWORD_FORMAT';
                if (value.length < 6) return 'TOO_SHORT_PASSWORD';
                // if (!(/\d/.test(value))) return 'PASSWORD_SHOULD_CONTAIN_AT_LEAST_ONE_DIGIT';
                // if (!(/[a-z]/.test(value))) return 'PASSWORD_SHOULD_CONTAIN_AT_LEAST_ONE_LOWER_CHARACTER';
                // if (!(/[A-Z]/.test(value))) return 'PASSWORD_SHOULD_CONTAIN_AT_LEAST_ONE_UPPER_CHARACTER';
            }
        };
    },

    'greater_than_date'(field) {
        return (value, params) => {
            if (params[field] > value) return 'WRONG_DATES_VALUES_IN_PERIOD';
        };
    },

    'db_id'() {
        return (value, params, outputArr) => {
            if (value === null || value === undefined || value === '') return;

            try {
                // eslint-disable-next-line no-undef
                const bi = BigInt(value);

                if (bi <= 0) return 'BAD_ID';
                outputArr.push(`${bi}`);
            } catch (e) {
                return 'BAD_ID';
            }
        };
    },

    'phone'() {
        return (value, params, outputArr) => {
            if (value) {
                const numbers = value.replace(/\D/g, '');

                if (numbers.length < 6 || numbers.length > 20) return 'WRONG_PHONE_FORMAT';

                // const [ validPhone ] = phone(`+${numbers}`);

                // if (!validPhone) return 'WRONG_PHONE_FORMAT';

                outputArr.push(`+${numbers}`);
            }
        };
    },

    'time'() {
        return (value, params, outputArr) => {
            if (value) {
                const valueDate = moment(value, 'HH:mm:ss', true);

                if (!valueDate.isValid()) return 'WRONG_TIME_FORMAT';

                outputArr.push(valueDate.format('HH:mm:ss'));
            }
        };
    },

    'dateonly'() {
        return (value, params, outputArr) => {
            if (value) {
                const valueDate = moment(value, 'YYYY-MM-DD', true);

                if (!valueDate.isValid()) return 'WRONG_DATE_FORMAT';

                outputArr.push(valueDate.format('YYYY-MM-DD'));
            }
        };
    },

    'list_is_unique_by'(...params) {
        params.pop();

        return (value) => {
            if (!Array.isArray(value)) return 'FORMAT_ERROR';

            let iteratee = params;

            if (Array.isArray(params)) {
                iteratee = (el) => {
                    const values = params.map(param => {
                        return el[param].toString();
                    });

                    return values.join('');
                };
            }

            const uniqArrLength = uniquBy(value, iteratee).length;

            if (uniqArrLength !== value.length) return 'LIST_HAS_DUPLICATES';
        };
    },

    'required_if_other_fields_empty'(...fields) {
        fields.pop();

        return (value, body) => {
            const isArray = Array.isArray(value);

            if ((value && !isArray) || (isArray && value.length)) return;

            for (const field of fields) {
                if (body[field] === undefined || body[field] === null || body[field] === '') return 'REQUIRED';
                if (Array.isArray(body[field])) {
                    if (!body[field].length)  return 'REQUIRED';
                }
            }

            return;
        };
    },

    'is_url'() {
        return (value) => {
            if (value) {
                try {
                    // eslint-disable-next-line no-new
                    new URL(value);

                    return;
                } catch (error) {
                    return 'WRONG_URL_FORMAT';
                }
            }
        };
    },

    'fixed_not_empty_list'() {
        return list => {
            if (list === undefined || list === null) return;
            if (!Array.isArray(list)) return 'FORMAT_ERROR';
            if (list.length < 1) return 'CANNOT_BE_EMPTY';

            return;
        };
    },

    'fixed_min_length'(minLength) {
        return (value, params, outputArr) => {
            if (value === undefined || value === null) return;
            if (typeof value === 'object') return 'FORMAT_ERROR';

            value += '';
            if (value.length < minLength) return 'TOO_SHORT';
            outputArr.push(value);
        };
    },


    'fixed_max_length'(maxLength) {
        return (value, params, outputArr) => {
            if (value === undefined || value === null) return;
            if (typeof value === 'object') return 'FORMAT_ERROR';

            value += '';
            if (value.length > maxLength) return 'TOO_LONG';
            outputArr.push(value);
        };
    },

    'list_length_equal'(len) {
        return list => {
            if (list === undefined || list === null) return;
            if (!Array.isArray(list)) return 'FORMAT_ERROR';
            if (list.length !== len) return 'WRONG_LENGTH';

            return;
        };
    },

    'list_length_max'(len) {
        return list => {
            if (list === undefined || list === null) return;
            if (!Array.isArray(list)) return 'FORMAT_ERROR';
            if (list.length > len) return 'LIST_TOO_LONG';

            return;
        };
    },

    'custom_error_code'(error_code, rule) {
        const brule = arguments[arguments.length - 1][rule].apply(null,
            Array.prototype.slice.call(arguments, 2, arguments.length - 1));

        return (value, params, outputArr) => {
            const message = brule(value, params, outputArr);

            return (!message || !error_code) ? message : error_code;
        };
    },

    'filter_empty_values'() {
        return (value, params, outputArr) => {
            if (!value || !(value instanceof Array)) return;

            outputArr.push(value.filter(v => v));
        };
    },

    'fixed_email'() {
        // eslint-disable-next-line max-len
        const emailRe = /^([a-zA-Z\-0-9_"]+(\.[a-zA-Z\-0-9_"]+)*)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9_]+\.)+[a-zA-Z]{2,}))$/;

        return value => {
            if (value === null || value === undefined || value === '') return;
            if (typeof value !== 'string') return 'FORMAT_ERROR';

            if (!emailRe.test(value)) return 'WRONG_EMAIL';

            return;
        };
    },

    'not_equal_to_field'(field) {
        return (value, params) => {
            if (util.isNoValue(value)) return;
            if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';

            if (value === params[field]) return 'FIELDS_EQUAL';

            return;
        };
    },

    'rstpurl'() {
        const urlReStr =
            '^rtsp://(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[0-1]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))\\.?|localhost)(?::\\d{2,5})?(?:[/?#]\\S*)?$';
        const urlRe = new RegExp(urlReStr, 'i');

        return value => {
            if (util.isNoValue(value)) return;
            if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';

            if (value.length < 2083 && urlRe.test(value)) return;

            return 'WRONG_URL';
        };
    },

    'url_with_specific_protocol'(requiredProtocol) {
        return (value, allValues, outputArr) => {
            if (util.isNoValue(value)) return;

            const errorCode = `WRONG_${requiredProtocol.toUpperCase()}_URL`;

            try {
                const url = new URL(value);
                const protocol = url.protocol.slice(0, -1);

                if (protocol !== requiredProtocol) return errorCode;

                outputArr.push(url.toString());
            } catch {
                return errorCode;
            }
        };
    }
};

LIVR.Validator.registerDefaultRules(defaultRules);
