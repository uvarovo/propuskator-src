import chista from '../../chista.js';

import Show   from '../../../services/mobile/accessSubjects/Show';
import SwitchReaderGroupsMode from '../../../services/mobile/accessSubjects/SwitchReaderGroupsMode';

export default {
    show                   : chista.makeServiceRunner(Show, () => ({})),
    switchReaderGroupsMode : chista.makeServiceRunner(SwitchReaderGroupsMode, (req) => ({ ...req.params, ...req.body }))
};
