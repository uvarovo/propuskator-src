import chista from '../../chista.js';

import Create       from '../../../services/admin/accessSettings/Create';
import Show         from '../../../services/admin/accessSettings/Show';
import List         from '../../../services/admin/accessSettings/List';
import Update       from '../../../services/admin/accessSettings/Update';
import Delete       from '../../../services/admin/accessSettings/Delete';

export default {
    create : chista.makeServiceRunner(Create, req => ({ ...req.body })),
    show   : chista.makeServiceRunner(Show, req  => ({ ...req.params })),
    list   : chista.makeServiceRunner(List, req => ({ ...req.query })),
    update : chista.makeServiceRunner(Update, req => ({ ...req.body, ...req.params })),
    delete : chista.makeServiceRunner(Delete, req => ({ ...req.params }))
};
