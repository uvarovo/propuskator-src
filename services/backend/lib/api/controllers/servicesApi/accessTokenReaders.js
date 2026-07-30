import chista from '../../chista.js';

import BulkCreate from '../../../services/servicesApi/accessTokenReaders/BulkCreate';

export default {
    bulkCreate : chista.makeServiceRunner(BulkCreate, req => ({ ...req.body }))
};
