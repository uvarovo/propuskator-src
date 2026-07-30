import chista from '../../chista.js';

import List from '../../../services/mobile/accessTokenReaders/List/index.js';
import Open from '../../../services/mobile/accessTokenReaders/Open';

export default {
    list : chista.makeServiceRunner(List, req => ({ ...req.query })),
    open : chista.makeServiceRunner(Open, req => ({ ...req.params }))
};
