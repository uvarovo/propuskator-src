import chista from '../../../chista.js';

import Save   from '../../../../services/tokenReader/v1/accessLogs/Save';

export default {
    save : chista.makeServiceRunner(Save, ({ body }) => ({ body: (typeof body === 'string') ? body : undefined }))
};
