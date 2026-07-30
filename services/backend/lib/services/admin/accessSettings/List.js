import Base        from '../../Base';
import AccessSetting from '../../../models/AccessSetting';
import {
    dumpAccessSetting
} from '../../utils/dumps';
import DX from '../../../models/utils/DX';

export default class AccessSettingList extends Base {
    static validationRules = {
        ids                   : [ { 'list_of': 'db_id' }, 'fixed_not_empty_list' ],
        limit                 : [ 'positive_integer', { 'default': 20 } ],
        offset                : [ 'integer', { 'default': 0 }, { 'min_number': 0 } ],
        sortedBy              : [ 'string', { 'one_of': [ 'enabled', 'createdAt', 'updatedAt' ] }, { 'default': 'createdAt' } ],
        order                 : [ 'string', 'to_uc', { 'one_of': [ 'ASC', 'DESC' ] }, { 'default': 'DESC' } ],
        enabled               : [ 'boolean' ],
        isArchived            : [ 'boolean' ],
        updateStart           : [ 'is_date' ],
        updateEnd             : [ 'is_date' ],
        createStart           : [ 'is_date' ],
        createEnd             : [ 'is_date' ],
        accessSubjectIds      : [ 'list_items_unique', { 'list_of': [ 'db_id' ] }, 'filter_empty_values' ],
        accessScheduleIds     : [ 'list_items_unique', { 'list_of': [ 'db_id' ] }, 'filter_empty_values' ],
        accessTokenReaderIds  : [ 'list_items_unique', { 'list_of': [ 'db_id' ] }, 'filter_empty_values' ],
        accessReadersGroupIds : [ 'list_items_unique', { 'list_of': [ 'db_id' ] }, 'filter_empty_values' ],
        search                : [ 'string', 'trim' ]
    };

    async execute(params) {
        try {
            const { accessSettings, count } = await AccessSetting.findAllByParams(params);

            return {
                data : accessSettings.map(dumpAccessSetting),
                meta : {
                    filteredCount : count,
                    total         : await AccessSetting.count()
                }
            };
        } catch (e) {
            if (e instanceof DX) {// holly shield
                throw e;
            } else throw e;
        }
    }
}
