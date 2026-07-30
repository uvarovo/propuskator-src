import chista from '../../chista';

import Create from '../../../services/mobile/accessReaderMobileGroups/Create';
import Show   from '../../../services/mobile/accessReaderMobileGroups/Show';
import List   from '../../../services/mobile/accessReaderMobileGroups/List';
import Update from '../../../services/mobile/accessReaderMobileGroups/Update';
import Delete from '../../../services/mobile/accessReaderMobileGroups/Delete';
import ListLogos from '../../../services/mobile/accessReaderMobileGroups/ListLogos';

export default {
    create    : chista.makeServiceRunner(Create, req => ({ ...req.body })),
    show      : chista.makeServiceRunner(Show, req  => ({ ...req.params })),
    list      : chista.makeServiceRunner(List, req => ({ ...req.query })),
    update    : chista.makeServiceRunner(Update, req => ({ ...req.body, ...req.params })),
    delete    : chista.makeServiceRunner(Delete, req => ({ ...req.params })),
    listLogos : chista.makeServiceRunner(ListLogos, () => ({}))
};
