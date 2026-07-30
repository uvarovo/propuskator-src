import Base                       from '../../Base';
import AccessReadersGroup         from '../../../models/AccessReadersGroup';
import { dumpAccessReadersGroup } from '../../utils/dumps';
import DX from '../../../models/utils/DX';

export default class AccessReadersGroupList extends Base {
    static validationRules = {
        ids         : [ { 'list_of': 'db_id' }, 'fixed_not_empty_list' ],
        search      : [ 'string', { 'max_length': 255 } ],
        limit       : [ 'positive_integer', { 'default': 20 } ],
        offset      : [ 'integer', { 'default': 0 }, { 'min_number': 0 } ],
        sortedBy    : [ 'string', { 'one_of': [ 'createdAt', 'updatedAt', 'enabled', 'name', 'id', 'popularityCoef' ] }, { 'default': 'id' } ],
        order       : [ 'string', 'to_uc', { 'one_of': [ 'ASC', 'DESC' ] }, { 'default': 'DESC' } ],
        enabled     : [ 'boolean' ],
        isArchived  : [ 'boolean' ],
        updateStart : [ 'is_date' ],
        updateEnd   : [ 'is_date' ],
        createStart : [ 'is_date' ],
        createEnd   : [ 'is_date' ]
    };

    async execute(params) {
        try {
            const { accessReadersGroups, count } = await AccessReadersGroup.findAllByParams(params);

            return {
                data : accessReadersGroups.map(dumpAccessReadersGroup),
                meta : {
                    filteredCount : count,
                    total         : await AccessReadersGroup.count()
                }
            };
        } catch (e) {
            if (e instanceof DX) {// holly shield
                throw e;
            } else throw e;
        }
    }
}
