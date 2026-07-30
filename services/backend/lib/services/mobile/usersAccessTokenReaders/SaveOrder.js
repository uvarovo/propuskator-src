import Base                  from '../../Base';
import UserAccessTokenReader from '../../../models/UserAccessTokenReader';
import DX                    from '../../../models/utils/DX';
import sequelize             from '../../../sequelizeSingleton';
import {
    TimeoutError,
    NotFoundError,
    OpenDoorError
} from '../../utils/SX';

export default class UsersAccessTokenReadersSaveOrder extends Base {
    static validationRules = {
        accessTokenReadersOrder : [ 'required', 'list_items_unique', { 'list_of': [ 'db_id' ] }, 'filter_empty_values' ]
    };

    // TODO: add accessTokenReaderId validation in case when user doesn't have permissions
    async execute({ accessTokenReadersOrder }) {
        const transaction = await sequelize.transaction();

        try {
            const userId = this.cls.get('userId');

            await Promise.all(accessTokenReadersOrder.map(async (accessTokenReaderId, position) => {
                const existingAccessTokenReader = await UserAccessTokenReader.findOne({
                    where : { userId, accessTokenReaderId },
                    transaction
                });

                return existingAccessTokenReader ?
                    UserAccessTokenReader.update({ position }, { // not static update method doesn't work properly
                        where : { userId, accessTokenReaderId }
                    }, { transaction }) :
                    UserAccessTokenReader.create({
                        userId,
                        accessTokenReaderId,
                        position
                    }, { transaction });
            }));

            await transaction.commit();

            return {};
        } catch (e) {
            await transaction.rollback();

            if (e instanceof DX) {
                if (e instanceof DX.NotFoundError) {
                    throw new NotFoundError(NotFoundError.codes.CANNOT_FIND_MODEL, {
                        modelName : e.modelName, primaryKey : e.primaryKey
                    });
                } else if (e instanceof DX.TimeoutError) {
                    throw new TimeoutError();
                } else if (e instanceof DX.OpenDoorError) {
                    throw new OpenDoorError();
                } else throw e;
            } else throw e;
        }
    }
}
