import chista from '../../chista.js';

import Create from '../../../services/admin/accessTokenReaders/Create';
import Show   from '../../../services/admin/accessTokenReaders/Show';
import List   from '../../../services/admin/accessTokenReaders/List';
import ListConnectionStatuses from '../../../services/admin/accessTokenReaders/ListConnectionStatuses';
import Update from '../../../services/admin/accessTokenReaders/Update';
import Open from '../../../services/admin/accessTokenReaders/Open';
import Delete from '../../../services/admin/accessTokenReaders/Delete';
import ListPhoneNumbers from '../../../services/admin/accessTokenReaders/ListPhoneNumbers';
import AddDisplayedTopic from '../../../services/admin/accessTokenReaders/AddDisplayedTopic.js';
import RemoveDisplayedTopic from '../../../services/admin/accessTokenReaders/RemoveDisplayedTopic.js';

export default {
    create                 : chista.makeServiceRunner(Create, req => ({ ...req.body })),
    show                   : chista.makeServiceRunner(Show, req  => ({ ...req.params })),
    list                   : chista.makeServiceRunner(List, req => ({ ...req.query })),
    listConnectionStatuses : chista.makeServiceRunner(ListConnectionStatuses, () => ({})),
    update                 : chista.makeServiceRunner(Update, req => ({ ...req.body, ...req.params })),
    open                   : chista.makeServiceRunner(Open, req => ({ ...req.params })),
    delete                 : chista.makeServiceRunner(Delete, req => ({ ...req.params })),
    listPhoneNumbers       : chista.makeServiceRunner(ListPhoneNumbers, () => ({})),
    addDisplayedTopic      : chista.makeServiceRunner(AddDisplayedTopic, req => ({ ...req.body })),
    removeDisplayedTopic   : chista.makeServiceRunner(RemoveDisplayedTopic, req => ({ ...req.body }))
};
