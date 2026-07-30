import chista                from '../../chista.js';
import processFiles          from '../../../utils/processFiles';
import { sendAndDeleteFile } from '../../../utils/responseBuilders.js';

import Create          from '../../../services/admin/accessSubjects/Create';
import Show            from '../../../services/admin/accessSubjects/Show';
import List            from '../../../services/admin/accessSubjects/List';
import Update          from '../../../services/admin/accessSubjects/Update';
import Delete          from '../../../services/admin/accessSubjects/Delete';
import ExportCsv       from '../../../services/admin/accessSubjects/ExportCsv';
import Invite          from '../../../services/admin/accessSubjects/Invite';
import CreateOnRequest from '../../../services/admin/accessSubjects/CreateOnRequest.js';

export default {
    create    : chista.makeServiceRunner(Create, req => ({ ...processFiles(req.body, req.files) })),
    show      : chista.makeServiceRunner(Show, req  => ({ ...req.params })),
    list      : chista.makeServiceRunner(List, req => ({ ...req.query })),
    exportCsv : chista.makeServiceRunner(ExportCsv, () => ({}), sendAndDeleteFile),
    update    : chista.makeServiceRunner(Update, req => ({
        ...processFiles(req.body, req.files),
        ...req.params
    })),
    delete          : chista.makeServiceRunner(Delete, req => ({ ...req.params })),
    invite          : chista.makeServiceRunner(Invite, req => ({ ...req.params })),
    createOnRequest : chista.makeServiceRunner(CreateOnRequest, req => ({ ...processFiles(req.body, req.files) }))
};
