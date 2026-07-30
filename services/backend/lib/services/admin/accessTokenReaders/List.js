import Base        from '../../Base';
import AccessTokenReader from '../../../models/AccessTokenReader';
import {
    dumpAccessTokenReader
} from '../../utils/dumps';
import DX from '../../../models/utils/DX';

export default class AccessTokenReaderList extends Base {
    static validationRules = {
        ids                   : [ { 'list_of': 'db_id' }, 'fixed_not_empty_list' ],
        search                : [ 'string', { 'max_length': 255 } ],
        enabled               : [ 'boolean', { 'one_of': [ true, false ] } ],
        isArchived            : [ 'boolean', { 'one_of': [ true, false ] } ],
        stateStatus           : [ 'string', { 'one_of': [ AccessTokenReader.STATE_DISCONNECTED, AccessTokenReader.STATE_INACTIVE, AccessTokenReader.STATE_ACTIVE ] } ],
        connectionStatus      : [ 'string', { 'one_of': [ ...Object.values(AccessTokenReader.connectionStatusesTitles) ] } ],
        updateStart           : [ 'is_date' ],
        updateEnd             : [ 'is_date', { 'date_after_field': 'updateStart' } ],
        createStart           : [ 'is_date' ],
        createEnd             : [ 'is_date', { 'date_after_field': 'createStart' } ],
        accessReadersGroupIds : [ { 'list_of': 'db_id' } ],
        limit                 : [ 'positive_integer', { 'default': 20 } ],
        offset                : [ 'integer', { 'default': 0 }, { 'min_number': 0 } ],
        sortedBy              : [ 'string', { 'one_of': [ 'id', 'name', 'enabled', 'createdAt', 'updatedAt', 'popularityCoef', 'code' ] }, { 'default': 'createdAt' } ],
        order                 : [ 'string', 'to_uc', { 'one_of': [ 'ASC', 'DESC' ] }, { 'default': 'DESC' } ],
        hasAssignedCamera     : [ 'boolean' ]
    };

    async execute(params) {
        try {
            const { accessTokenReaders, count } = await AccessTokenReader.findAllByParams(params);

            return {
                data : accessTokenReaders.map(dumpAccessTokenReader),
                meta : {
                    filteredCount : count,
                    total         : await AccessTokenReader.count()
                }
            };
        } catch (e) {
            if (e instanceof DX) {// holly shield
                throw e;
            } else throw e;
        }
    }
}
