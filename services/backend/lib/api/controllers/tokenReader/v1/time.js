import chista from '../../../chista.js';

import TimeShow from '../../../../services/tokenReader/v1/time/Show';

export default {
    show : chista.makeServiceRunner(TimeShow)
};
