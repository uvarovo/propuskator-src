import { mailOptions, dns } from '../config';
import { initLogger } from '../extensions/Logger';
import EmailSender from './EmailSender';

if (!mailOptions.transportOptions.port) delete mailOptions.transportOptions.port;
else mailOptions.transportOptions.port = parseInt(mailOptions.transportOptions.port, 10);

const emailSender = new EmailSender({
    mailOptions,
    defaultParams : {
        baseUrl : `https://${dns}`
    },
    debug : initLogger('EmailSender')
});

export default emailSender;
