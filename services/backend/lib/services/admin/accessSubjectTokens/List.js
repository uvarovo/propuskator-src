import Base              from '../../Base';
import AccessSubjectToken         from '../../../models/AccessSubjectToken';
import { dumpAccessSubjectToken } from '../../utils/dumps';
import DX from '../../../models/utils/DX';

export default class AccessSubjectTokenList extends Base {
    static validationRules = {
        ids             : [ { 'list_of': 'db_id' }, 'fixed_not_empty_list' ],
        search          : [ 'string', { 'max_length': 255 } ],
        type            : [ 'string', 'to_uc', { 'one_of': [ AccessSubjectToken.TYPE_NFC, AccessSubjectToken.TYPE_RFID ] } ],
        accessSubjectId : [ { 'or': [ 'db_id', { 'eq': null } ] } ],
        enabled         : [ 'boolean', { 'one_of': [ true, false ] } ],
        isArchived      : [ 'boolean', { 'one_of': [ true, false ] } ],
        updateStart     : [ 'is_date' ],
        updateEnd       : [ 'is_date' ],
        createStart     : [ 'is_date' ],
        createEnd       : [ 'is_date' ],
        limit           : [ 'positive_integer', { 'default': 20 } ],
        offset          : [ 'integer', { 'min_number': 0 }, { 'default': 0 } ],
        sortedBy        : [ 'string', { 'one_of': [ 'type', 'createdAt', 'updatedAt', 'code', 'name', 'enabled', 'id', 'isArchived' ] }, { 'default': 'createdAt' } ],
        order           : [ 'string', 'to_uc', { 'one_of': [ 'ASC', 'DESC' ] }, { 'default': 'DESC' } ]
    };

    async execute(params) {
        try {
            const { accessSubjectTokens, count } = await AccessSubjectToken.findAllByParams(params);

            return {
                data : accessSubjectTokens.map(dumpAccessSubjectToken),
                meta : {
                    filteredCount : count,
                    total         : await AccessSubjectToken.count()
                }
            };
        } catch (e) {
            if (e instanceof DX) {// holly shield
                throw e;
            } else throw e;
        }
    }
}
