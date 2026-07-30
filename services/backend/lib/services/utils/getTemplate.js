import path       from 'path';
import fs         from 'fs-extra';
import handlebars from 'handlebars';

const TEMPLATES_BY_TYPE = {
    ACTIVATE_USER            : 'activateUser',
    RESET_PASSWORD_WITH_URL  : 'resetPasswordWithUrl',
    RESET_PASSWORD_WITH_CODE : 'resetPasswordWithCode',
    INVITE_ACCESS_SUBJECT    : 'inviteAccessSubject',
    REPORTED_GENERIC_ISSUE   : 'reportedGenericIssue',
    INVITE_USER_AUTHORIZE    : 'inviteUserAuthorize'
};

const TEMPLATES_LIST = {};

export default async function getTemplate(type) {
    const templateName = TEMPLATES_BY_TYPE[type];

    if (TEMPLATES_LIST[templateName]) {
        return TEMPLATES_LIST[templateName];
    }

    const templatesDir = path.resolve(__dirname, './../../../etc/mailTemplates');
    const [ bodyTemplate, subjectTemplate ] = await Promise.all([
        fs.readFile(path.join(templatesDir, templateName, 'body.html'), 'utf8'),
        fs.readFile(path.join(templatesDir, templateName, 'subject.html'), 'utf8')
    ]);

    const template = {
        body    : handlebars.compile(bodyTemplate),
        subject : handlebars.compile(subjectTemplate)
    };

    // eslint-disable-next-line require-atomic-updates
    TEMPLATES_LIST[templateName] = template;

    return template;
}
