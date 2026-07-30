import Base                          from '../../Base';
import { dumpUserAccessTokenReader } from '../../utils/dumps';
import UserAccessTokenReader         from '../../../models/UserAccessTokenReader';
import sequelize                     from '../../../sequelizeSingleton';

export default class UsersAccessTokenReadersUpdate extends Base {
    static validationRules = {
        accessTokenReaderId : [ 'required', 'positive_integer' ],
        customName          : [ 'not_empty' ]
    };

    // TODO: add accessTokenReaderId validation in case when user doesn't have permissions
    async execute({ accessTokenReaderId, ...fields }) {
        const transaction = await sequelize.transaction();

        try {
            const userId = this.cls.get('userId');

            let userAccessTokenReader = await UserAccessTokenReader.findOne({
                where : { userId, accessTokenReaderId },
                transaction
            });

            if (!userAccessTokenReader) {
                userAccessTokenReader = await UserAccessTokenReader.create({
                    userId,
                    accessTokenReaderId,
                    ...fields
                }, { transaction });
            } else {
                await userAccessTokenReader.update({ ...fields }, { transaction });
            }

            await transaction.commit();

            return {
                data : dumpUserAccessTokenReader(userAccessTokenReader)
            };
        } catch (e) {
            await transaction.rollback();

            throw e;
        }
    }
}
