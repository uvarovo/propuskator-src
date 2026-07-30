import chista from '../../chista.js';
import Create from '../../../services/mobile/reportedIssues/Create';

export default {
    create : chista.makeServiceRunner(Create, req => ({ ...req.body }))
};
