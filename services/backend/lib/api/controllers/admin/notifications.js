import chista from '../../chista.js';

import List       from '../../../services/admin/notifications/List';
import Activate   from '../../../services/admin/notifications/Activate';
import Deactivate from '../../../services/admin/notifications/Deactivate';
import ReadAll    from '../../../services/admin/notifications/ReadAll';

export default {
    list       : chista.makeServiceRunner(List, req => ({ ...req.query })),
    activate   : chista.makeServiceRunner(Activate, req => ({ ...req.body })),
    deactivate : chista.makeServiceRunner(Deactivate, req => ({ ...req.body })),
    readAll    : chista.makeServiceRunner(ReadAll, req => ({ ...req.body }))
};
