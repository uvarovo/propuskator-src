import chista from '../../chista.js';

import References from '../../../services/References';

export default {
    show : chista.makeServiceRunner(References, req => ({ ...req.params }))
};
