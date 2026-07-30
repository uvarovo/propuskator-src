import chista       from '../../chista.js';
import processFiles from '../../../utils/processFiles';

import Register                  from '../../../services/mobile/users/Register';
import Update                    from '../../../services/mobile/users/Update';
import Show                      from '../../../services/mobile/users/Show';
import MqttCredentials           from '../../../services/mobile/users/MqttCredentials';
import RequestPasswordReset      from '../../../services/mobile/users/RequestPasswordReset';
import ValidatePasswordResetCode from '../../../services/mobile/users/ValidatePasswordResetCode';
import PasswordReset             from '../../../services/mobile/users/PasswordReset';
import Delete                    from '../../../services/mobile/users/Delete';
import CreateRegistrationRequest from '../../../services/mobile/users/CreateRegistrationRequest.js';

export default {
    register             : chista.makeServiceRunner(Register, req => ({ ...processFiles(req.body, req.files) })),
    update               : chista.makeServiceRunner(Update, req => ({ ...processFiles(req.body, req.files) })),
    show                 : chista.makeServiceRunner(Show, () => ({})),
    delete               : chista.makeServiceRunner(Delete, () => ({})),
    mqttCredentials      : chista.makeServiceRunner(MqttCredentials, () => ({})),
    requestPasswordReset : chista.makeServiceRunner(RequestPasswordReset, req => ({
        ...req.body
        // useragent : req.useragent
    })),
    validatePasswordResetCode : chista.makeServiceRunner(ValidatePasswordResetCode, req => ({ ...req.body })),
    passwordReset             : chista.makeServiceRunner(PasswordReset, req => ({ ...req.body })),
    createRegistrationRequest : chista.makeServiceRunner(CreateRegistrationRequest, req => ({
        ...req.body,
        ip : req.headers['x-real-ip']
    }))
};
