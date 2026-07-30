import ServiceBase    from 'chista/ServiceBase';
import AccessCamera       from '../../../models/AccessCamera';
import { dumpAccessCamera }   from '../../utils/dumps';
import DX from '../../../models/utils/DX';

export default class AccessCameraList extends ServiceBase {
    static validationRules = {
        ids         : [ { 'list_of': 'db_id' }, 'fixed_not_empty_list' ],
        search      : [ 'string', { 'max_length': 255 } ],
        enabled     : [ 'boolean' ],
        status      : [ 'string', { 'one_of': [ AccessCamera.statuses.READY, AccessCamera.statuses.DISCONNECTED, AccessCamera.statuses.INIT ] } ],
        isArchived  : [ 'boolean' ],
        updateStart : [ 'is_date' ],
        updateEnd   : [ 'is_date', { 'date_after_field': 'updateStart' } ],
        createStart : [ 'is_date' ],
        createEnd   : [ 'is_date', { 'date_after_field': 'createStart' } ],
        limit       : [ 'positive_integer', { 'default': 20 } ],
        offset      : [ 'integer', { 'default': 0 }, { 'min_number': 0 } ],
        sortedBy    : [ 'string', { 'one_of': [ 'name', 'enabled', 'createdAt', 'updatedAt' ] }, { 'default': 'createdAt' } ],
        order       : [ 'string', 'to_uc', { 'one_of': [ 'ASC', 'DESC' ] }, { 'default': 'DESC' } ]
    };

    async execute(params) {
        try {
            const { accessCameras, count } = await AccessCamera.findAllByParams(params);

            return {
                data : accessCameras.map(dumpAccessCamera),
                meta : {
                    filteredCount : count, // filtered count should means total number of rows matching the query
                    total         : await AccessCamera.count()
                }
            };
        } catch (e) {
            if (e instanceof DX) {// holly shield
                throw e;
            } else throw e;
        }
    }
}
