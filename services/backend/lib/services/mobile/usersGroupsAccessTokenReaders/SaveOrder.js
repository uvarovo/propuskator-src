import Base                        from '../../Base.js';
import sequelize                   from '../../../sequelizeSingleton.js';
import UsersGroupAccessTokenReader from '../../../models/UsersGroupAccessTokenReader.js';

export default class UsersGroupsAccessTokenReadersSaveOrder extends Base {
    static validationRules = {
        accessReadersMobileGroupId : [ 'required', 'db_id' ],
        accessTokenReadersOrder    : [
            'required',
            'list_items_unique',
            { 'list_of': [ 'db_id' ] },
            'filter_empty_values'
        ]
    };

    async execute({ accessReadersMobileGroupId, accessTokenReadersOrder }) {
        const transaction = await sequelize.transaction();

        try {
            const userId = this.cls.get('userId');

            await Promise.all(accessTokenReadersOrder.map(async (accessTokenReaderId, position) => {
                // where clause for the target user's group access token reader
                const whereClause = { accessReadersMobileGroupId, accessTokenReaderId, userId };
                // user's group access token reader
                const existingAccessTokenReader = await UsersGroupAccessTokenReader.findOne({
                    where : whereClause,
                    transaction
                });

                return existingAccessTokenReader ?
                    UsersGroupAccessTokenReader.update({ position }, {
                        where : { accessReadersMobileGroupId, accessTokenReaderId, userId },
                        transaction
                    }) :
                    UsersGroupAccessTokenReader.create({
                        accessReadersMobileGroupId,
                        accessTokenReaderId,
                        userId,
                        position
                    });
            }));

            await transaction.commit();

            return {};
        } catch (err) {
            await transaction.rollback();

            throw err;
        }
    }
}
