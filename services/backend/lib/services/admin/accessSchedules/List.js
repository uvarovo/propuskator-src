import ServiceBase    from 'chista/ServiceBase';
import AccessSchedule       from '../../../models/AccessSchedule';
import {
    dumpAccessSchedule
}   from '../../utils/dumps';
import DX from '../../../models/utils/DX';

export default class AccessScheduleList extends ServiceBase {
    static validationRules = {
        ids         : [ { 'list_of': 'db_id' }, 'fixed_not_empty_list' ],
        limit       : [ 'positive_integer', { 'default': 20 } ],
        offset      : [ 'integer', { 'default': 0 }, { 'min_number': 0 } ],
        sortedBy    : [ 'string', { 'one_of': [ 'createdAt', 'updatedAt', 'name', 'enabled', 'popularityCoef' ] }, { 'default': 'createdAt' } ],
        periodicity : [ 'string', { 'one_of': [ 'NOT_PERIODIC', 'PERIODIC' ] } ],
        order       : [ 'string', 'to_uc', { 'one_of': [ 'ASC', 'DESC' ] }, { 'default': 'DESC' } ],
        search      : [ 'string', { 'max_length': 255 } ],
        enabled     : [ 'boolean' ],
        isArchived  : [ 'boolean' ],
        updateStart : [ 'is_date' ],
        updateEnd   : [ 'is_date' ],
        createStart : [ 'is_date' ],
        createEnd   : [ 'is_date' ]
    };

    async execute(params) {
        try {
            const { accessSchedules, count } = await AccessSchedule.findAllByParams(params);

            return {
                data : accessSchedules.map(dumpAccessSchedule),
                meta : {
                    filteredCount : count,
                    total         : await AccessSchedule.count()
                }
            };
        } catch (e) {
            if (e instanceof DX) {// holly shield
                throw e;
            } else throw e;
        }
    }
}
