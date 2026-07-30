import nodemailer        from 'nodemailer';
import sendmailTransport from 'nodemailer-sendmail-transport';
import smtpTransport     from 'nodemailer-smtp-transport';

import getTemplate   from './utils/getTemplate.js';

const TRANSPORTS_BY_TYPE = {
    SMTP     : smtpTransport,
    SENDMAIL : sendmailTransport
};

class EmailSender {
    constructor({ mailOptions, defaultParams = {}, debug } = {}) {
        const { transportType, transportOptions } = mailOptions || {};

        const Transport = TRANSPORTS_BY_TYPE[transportType];

        if (!Transport) throw new Error('Transport not found');

        this.transport = nodemailer.createTransport(Transport(transportOptions));
        this.defaultParams = defaultParams;
        this.mailOptions = mailOptions;
        this.debug = debug;
    }

    // for testing
    setTransport(transport) {
        this.transport = transport;
    }

    async send(type, destinationEmail, data) {
        const sendData = { ...data, ...this.defaultParams };
        const template = await getTemplate(type);

        return this.#sendEmail({
            from    : this.mailOptions.from,
            to      : destinationEmail,
            subject : template.subject(sendData),
            html    : template.body(sendData)
        });
    }

    #sendEmail = async (data) => {
        this.debug.info(`Send email ${JSON.stringify({ from: data.from, to: data.to, subject: data.subject })}`);
        const response = await this.transport.sendMail(data);

        return response.messageId;
    }
}

export default EmailSender;
