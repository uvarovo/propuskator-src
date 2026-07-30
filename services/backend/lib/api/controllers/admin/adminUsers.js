import chista from '../../chista.js';
import processFiles from '../../../utils/processFiles';

import Register from '../../../services/admin/adminUsers/Register';
import Update from '../../../services/admin/adminUsers/Update';
import Show   from '../../../services/admin/adminUsers/Show';
import MqttCredentials   from '../../../services/admin/adminUsers/MqttCredentials';
import RequestPasswordReset   from '../../../services/admin/adminUsers/RequestPasswordReset';
import PasswordReset   from '../../../services/admin/adminUsers/PasswordReset';

export default {
    register             : chista.makeServiceRunner(Register, req => ({ ...processFiles(req.body, req.files) })),
    update               : chista.makeServiceRunner(Update, req => ({ ...processFiles(req.body, req.files) })),
    show                 : chista.makeServiceRunner(Show, () => ({})),
    mqttCredentials      : chista.makeServiceRunner(MqttCredentials, () => ({})),
    requestPasswordReset : chista.makeServiceRunner(RequestPasswordReset, req => ({
        ...req.body
        // useragent : req.useragent
    })),
    passwordReset : chista.makeServiceRunner(PasswordReset, req => ({ ...req.body }))
};
