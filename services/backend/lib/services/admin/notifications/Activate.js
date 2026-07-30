import Base                 from '../../Base';
import Notification         from '../../../models/Notification';
import DX from '../../../models/utils/DX';
import { NotFoundError } from '../../utils/SX';

export default class NotificationActivate extends Base {
    static validationRules = {
        ids : [ 'required', { 'list_of': [ 'db_id' ] } ]
    };

    async execute({ ids }) {
        try {
            const [ affectedCount ] = await Notification.update({
                isRead : false
            }, {
                where : {
                    id : ids
                }
            });

            return {
                ids,
                meta : { affectedCount }
            };
        } catch (e) {
            if (e instanceof DX) {
                if (e instanceof DX.NotFoundError) {
                    throw new NotFoundError(NotFoundError.codes.CANNOT_FIND_MODEL, {
                        modelName : e.modelName, primaryKey : e.primaryKey
                    });
                } else throw e;
            } else throw e;
        }
    }
}
