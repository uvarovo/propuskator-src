/* eslint-disable more/no-duplicated-chains, camelcase */
import {
    ReportedIssue,
    User,
    AdminUser
}                          from './models';
import { STATUSES, TYPES } from './constants/reportedIssues';
import { initLogger }      from './extensions/Logger';
import emailSender         from './services/emailSenderSingleton';
import { TEMPLATE_TYPES }  from './constants/emails';

const logger = initLogger('IssuesProcessor');

class IssuesProcessor {
    constructor(args) {
        if (!args.recieverEmail) throw new Error('"recieverEmail" is required');
        this.recieverEmail = args.recieverEmail;
    }

    async process() {
        logger.info('Processing issues started');
        try {
            const pendingIssues = await ReportedIssue.findAll({
                where   : { status: STATUSES.PENDING },
                include : [
                    { model: User, as: 'user' },
                    { model: AdminUser, as: 'admin' }
                ]
            });

            logger.info(`Found ${pendingIssues.length} pending issues`);

            await Promise.all(pendingIssues.map(this._processIssue.bind(this)));
            logger.info('Processing issues completed');
        } catch (error) {
            logger.error(error);
        }
    }

    async _processIssue(issue) {
        try {
            const emailPayload = this._prepareEmailPayload(issue);

            logger.debug(emailPayload);

            await issue.sending();
            await this._sendIssueEmail(emailPayload);
            await issue.sent();
        } catch (error) {
            logger.warn('Failed to process issue');
            logger.warn(error);
            await issue.pending();
        }
    }

    async _sendIssueEmail(payload) {
        return emailSender.send(
            TEMPLATE_TYPES.REPORTED_GENERIC_ISSUE,
            this.recieverEmail,
            payload
        );
    }

    _prepareEmailPayload(issue) {
        const genericIssueFields = {
            issue_type    : issue.type,
            issue_message : issue.message        };

        switch (issue.type) {
            case TYPES.MOBILE_APP:
                return {
                    ...genericIssueFields,
                    reporter_id    : issue.userId,
                    reporter_email : issue.user ? issue.user.email : 'user was deleted'
                };
            case TYPES.WEB_APP:
                return {
                    ...genericIssueFields,
                    reporter_id    : issue.adminId,
                    reporter_email : issue.admin ? issue.admin.login : 'vendor was deleted'
                };
            default:
                throw new Error(`Unsupported issue type ${issue.type}`);
        }
    }
}

export default IssuesProcessor;
