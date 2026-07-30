import chista from '../../chista.js';
import Create from '../../../services/admin/reportedIssues/Create';

export default {
    create : chista.makeServiceRunner(Create, req => ({ ...req.body }))
};
