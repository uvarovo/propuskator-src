import Base                  from '../../Base';
import { dumpReportedIssue } from '../../utils/dumps';
import ReportedIssue         from '../../../models/ReportedIssue';
import { USER_ISSUE_TYPES }  from '../../../constants/reportedIssues';

export default class ReportedIssueCreate extends Base {
    static validationRules = {
        message : [ 'required', 'string', 'not_empty' ],
        type    : [ 'required', 'string', { 'one_of': Object.values(USER_ISSUE_TYPES) } ]
    };

    async execute(data) {
        const issue = await ReportedIssue.createIssue({ ...data, userId: this.context.userId });

        return { data: dumpReportedIssue(issue) };
    }
}
