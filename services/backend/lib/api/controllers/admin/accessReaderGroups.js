import chista from '../../chista';

import Create from '../../../services/admin/accessReaderGroups/Create';
import Show   from '../../../services/admin/accessReaderGroups/Show';
import List   from '../../../services/admin/accessReaderGroups/List';
import Update from '../../../services/admin/accessReaderGroups/Update';
import Delete from '../../../services/admin/accessReaderGroups/Delete';

export default {
    create : chista.makeServiceRunner(Create, req => ({ ...req.body })),
    show   : chista.makeServiceRunner(Show, req  => ({ ...req.params })),
    list   : chista.makeServiceRunner(List, req => ({ ...req.query })),
    update : chista.makeServiceRunner(Update, req => ({ ...req.body, ...req.params })),
    delete : chista.makeServiceRunner(Delete, req => ({ ...req.params }))
};
