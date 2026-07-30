import chista from '../../chista.js';

import List from '../../../services/mobile/accessSubjectTokens/List';
import AttachWithId from '../../../services/mobile/accessSubjectTokens/AttachWithId';
import AttachWithName from '../../../services/mobile/accessSubjectTokens/AttachWithName';
import Detach from '../../../services/mobile/accessSubjectTokens/Detach';
import Enable from '../../../services/mobile/accessSubjectTokens/Enable';
import Disable from '../../../services/mobile/accessSubjectTokens/Disable';

export default {
    list           : chista.makeServiceRunner(List, req => ({ ...req.query })),
    attachWithId   : chista.makeServiceRunner(AttachWithId, req => ({ ...req.body })),
    attachWithName : chista.makeServiceRunner(AttachWithName, req => ({ ...req.body })),
    detach         : chista.makeServiceRunner(Detach, req => ({ ...req.params })),
    enable         : chista.makeServiceRunner(Enable, req => ({ ...req.params })),
    disable        : chista.makeServiceRunner(Disable, req => ({ ...req.params }))
};
