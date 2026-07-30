import chista from '../../chista.js';

import SaveOrder      from '../../../services/mobile/usersAccessTokenReaders/SaveOrder';
import UpdateOrCreate from '../../../services/mobile/usersAccessTokenReaders/UpdateOrCreate';

export default {
    saveOrder      : chista.makeServiceRunner(SaveOrder, req => ({ ...req.body })),
    updateOrCreate : chista.makeServiceRunner(UpdateOrCreate,
        req => ({
            accessTokenReaderId : req.body.accessTokenReaderId,
            customName          : req.body.customName
        })
    )
};
