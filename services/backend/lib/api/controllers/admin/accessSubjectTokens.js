import chista from '../../chista.js';
import { sendAndDeleteFile } from '../../../utils/responseBuilders.js';

import Create from '../../../services/admin/accessSubjectTokens/Create';
import BulkCreate from '../../../services/admin/accessSubjectTokens/BulkCreate';
import Show   from '../../../services/admin/accessSubjectTokens/Show';
import List   from '../../../services/admin/accessSubjectTokens/List';
import Update from '../../../services/admin/accessSubjectTokens/Update';
import Delete from '../../../services/admin/accessSubjectTokens/Delete';
import ExportCsv from '../../../services/admin/accessSubjectTokens/ExportCsv';

export default {
    create     : chista.makeServiceRunner(Create, req => ({ ...req.body })),
    bulkCreate : chista.makeServiceRunner(BulkCreate, req => ({ ...req.body })),
    show       : chista.makeServiceRunner(Show, req  => ({ ...req.params })),
    list       : chista.makeServiceRunner(List, req => ({ ...req.query })),
    exportCsv  : chista.makeServiceRunner(ExportCsv, () => ({}), sendAndDeleteFile),
    update     : chista.makeServiceRunner(Update, req => ({ ...req.body, ...req.params })),
    delete     : chista.makeServiceRunner(Delete, req => ({ ...req.params }))
};
