import Base                 from '../../Base';
import Notification         from '../../../models/Notification';

export default class NotificationReadAll extends Base {
    static validationRules = {};

    async execute() {
        try {
            const [ affectedCount ] = await Notification.update({
                isRead : true
            }, {
                where : {
                    isRead : false
                }
            });

            return {
                meta : { affectedCount }
            };
        } catch (e) {
            throw e;
        }
    }
}
