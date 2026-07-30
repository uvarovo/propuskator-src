import dotProp from 'dot-prop';
import { ValidationError } from '../SX';
import mappings from './mappings';

export default function formatter(error) {
    const formatted = new ValidationError();

    for (const field of Object.keys(error.fields)) {
        const code = error.fields[field];

        if (!code) continue;

        const message = dotProp.get(mappings.defaultMapping, code) || 'UNDEFINED_VALIDATION_ERROR';

        formatted.errors.push({
            message : message || 'FORMAT_ERROR',
            field
        });
    }

    return formatted;
}
