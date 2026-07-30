import chista from '../../chista.js';

import SaveOrder from '../../../services/mobile/usersGroupsAccessTokenReaders/SaveOrder.js';

export default {
    saveOrder : chista.makeServiceRunner(SaveOrder, req => ({
        accessReadersMobileGroupId : req.params.groupId,
        accessTokenReadersOrder    : req.body.accessTokenReadersOrder
    }))
};
