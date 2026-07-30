import Base from '../../Base';
import AccessReadersMobileGroup from '../../../models/AccessReadersMobileGroup';
import { dumpAccessReadersMobileGroup } from '../../utils/dumps';
import DX from '../../../models/utils/DX';

export default class List extends Base {
    static validationRules = {
        search   : [ 'string', { 'max_length': 255 } ],
        limit    : [ 'positive_integer', { 'default': 20 } ],
        offset   : [ 'integer', { 'default': 0 }, { 'min_number': 0 } ],
        sortedBy : [ 'string', { 'one_of': [ 'createdAt', 'updatedAt', 'name', 'id' ] }, { 'default': 'id' } ],
        order    : [ 'string', 'to_uc', { 'one_of': [ 'ASC', 'DESC' ] }, { 'default': 'DESC' } ]
    };

    async execute(params) {
        try {
            const accessSubjectId = this.cls.get('accessSubjectId');
            const { accessReadersMobileGroups, count } = await AccessReadersMobileGroup.findAllByParams({
                ...params,
                accessSubjectId
            });

            return {
                data : accessReadersMobileGroups.map(dumpAccessReadersMobileGroup),
                meta : {
                    filteredCount : count,
                    total         : await AccessReadersMobileGroup.count({ where: { accessSubjectId } })
                }
            };
        } catch (e) {
            if (e instanceof DX) {
                throw e;
            } else throw e;
        }
    }
}
