import chista from '../../../chista.js';

import Sync   from '../../../../services/tokenReader/v1/accessTokens/Sync';

export default {
    sync : chista.makeServiceRunner(Sync, ({ body }) => ({ body: (typeof body === 'string') ? body : undefined }))
};
