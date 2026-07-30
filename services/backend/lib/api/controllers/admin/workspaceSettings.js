import chista from '../../chista.js';

import Show from '../../../services/admin/workspaceSettings/Show';
import Update from '../../../services/admin/workspaceSettings/Update';

export default {
    show   : chista.makeServiceRunner(Show, () => ({})),
    update : chista.makeServiceRunner(Update, req => ({ ...req.body }))
};
