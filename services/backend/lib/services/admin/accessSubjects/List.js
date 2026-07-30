import ServiceBase    from 'chista/ServiceBase';
import AccessSubject       from '../../../models/AccessSubject';
import { dumpAccessSubject }   from '../../utils/dumps';
import DX from '../../../models/utils/DX';

export default class AccessSubjectList extends ServiceBase {
    static validationRules = {
        ids                  : [ { 'list_of': 'db_id' }, 'fixed_not_empty_list' ],
        search               : [ 'string', { 'max_length': 255 } ],
        accessSubjectTokenId : [ 'db_id' ],
        enabled              : [ 'boolean', { 'one_of': [ true, false ] } ],
        mobileEnabled        : [ 'boolean', { 'one_of': [ true, false ] } ],
        isArchived           : [ 'boolean', { 'one_of': [ true, false ] } ],
        updateStart          : [ 'is_date' ],
        updateEnd            : [ 'is_date', { 'date_after_field': 'updateStart' } ],
        createStart          : [ 'is_date' ],
        createEnd            : [ 'is_date', { 'date_after_field': 'createStart' } ],
        limit                : [ 'positive_integer', { 'default': 20 } ],
        offset               : [ 'integer', { 'default': 0 }, { 'min_number': 0 } ],
        sortedBy             : [ 'string', { 'one_of': [ 'name', 'enabled', 'createdAt', 'updatedAt', 'popularityCoef' ] }, { 'default': 'createdAt' } ],
        order                : [ 'string', 'to_uc', { 'one_of': [ 'ASC', 'DESC' ] }, { 'default': 'DESC' } ]
    };

    async execute(params) {
        try {
            const { accessSubjects, count } = await AccessSubject.findAllByParams(params);

            return {
                data : accessSubjects.map(dumpAccessSubject),
                meta : {
                    filteredCount : count,
                    total         : await AccessSubject.count()
                }
            };
        } catch (e) {
            if (e instanceof DX) {// holly shield
                throw e;
            } else throw e;
        }
    }
}
