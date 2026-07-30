import chista from '../../chista.js';

import Create from '../../../services/admin/accessSchedules/Create';
import Show   from '../../../services/admin/accessSchedules/Show';
import List   from '../../../services/admin/accessSchedules/List';
import Update from '../../../services/admin/accessSchedules/Update';
import Delete from '../../../services/admin/accessSchedules/Delete';

export default {
    create : chista.makeServiceRunner(Create, req => ({ ...req.body })),
    show   : chista.makeServiceRunner(Show, req  => ({ ...req.params })),
    list   : chista.makeServiceRunner(List, req => ({ ...req.query })),
    update : chista.makeServiceRunner(Update, req => ({ ...req.body, ...req.params })),
    delete : chista.makeServiceRunner(Delete, req => ({ ...req.params }))
};
