import chista from '../../chista.js';

import Create       from '../../../services/admin/accessCameras/Create';
import Show         from '../../../services/admin/accessCameras/Show';
import List         from '../../../services/admin/accessCameras/List';
import Update       from '../../../services/admin/accessCameras/Update';
import Delete       from '../../../services/admin/accessCameras/Delete';

export default {
    create : chista.makeServiceRunner(Create, req => ({ ...req.body })),
    show   : chista.makeServiceRunner(Show, req  => ({ ...req.params })),
    list   : chista.makeServiceRunner(List, req => ({ ...req.query })),
    update : chista.makeServiceRunner(Update, req => ({ ...req.body, ...req.params })),
    delete : chista.makeServiceRunner(Delete, req => ({ ...req.params }))
};
