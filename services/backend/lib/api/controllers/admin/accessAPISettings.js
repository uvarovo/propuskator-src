import chista from '../../chista.js';

import Show   from '../../../services/admin/accessAPISettings/Show';
import Refresh   from '../../../services/admin/accessAPISettings/Refresh';

export default {
    show    : chista.makeServiceRunner(Show, ()  => {}),
    refresh : chista.makeServiceRunner(Refresh, ()  => {})
};
