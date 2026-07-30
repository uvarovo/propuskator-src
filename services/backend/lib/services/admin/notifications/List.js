import Base                 from '../../Base';
import Notification         from '../../../models/Notification';
import { dumpNotification } from '../../utils/dumps';
import DX                   from '../../../models/utils/DX';
import { verboseTypes }     from '../../../constants/serviceConfiguration';

class NotificationList extends Base {
    static validationRules = {
        ids         : [ { 'list_of': 'db_id' }, 'fixed_not_empty_list' ],
        // sortedBy    : [ 'string', 'trim', { 'one_of': [ 'createdAt', 'isRead' ] } ],
        // order       : [ 'string', 'trim', 'to_uc', { 'one_of': [ 'ASC', 'DESC' ] }, { 'default': 'ASC' } ],
        isRead      : [ 'boolean', { 'one_of': [ true, false ] } ],
        limit       : [ 'positive_integer' ],
        offset      : [ 'integer', { 'default': 0 }, { 'min_number': 0 } ],
        updateStart : [ 'is_date' ],
        types       : [ { 'list_of': 'string' }, 'fixed_not_empty_list' ], // TODO: rework to pass a Object.values(notificationTypes) from task AC-609
        updateEnd   : [ 'is_date', { 'date_after_field': 'updateStart' } ],
        createStart : [ 'is_date' ],
        createEnd   : [ 'is_date', { 'date_after_field': 'createStart' } ]
    };

    async execute(params) {
        try {
            const { count: total, unreadTotal } = await Notification.countMeta();
            const { notifications, count } = await Notification.findAllByParams(params);

            return {
                data : notifications.map(dumpNotification),
                meta : {
                    filteredCount : count,
                    total,
                    unreadTotal
                }
            };
        } catch (e) {
            if (e instanceof DX) {
                throw e;
            } else throw e;
        }
    }
}

NotificationList.verboseTypes = {
    silenced : verboseTypes.silenced
};

export default NotificationList;
