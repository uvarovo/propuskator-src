import { DataTypes as DT } from 'sequelize';
import sequelize           from '../sequelizeSingleton';
import Base                from './Base';
import User                from './User';
import AccessTokenReader   from './AccessTokenReader';

class UserAccessTokenReader extends Base {
    static initRelations() {
        this.AssociationUser = this.belongsTo(User, { as: 'user', foreignKey: 'userId' });
        this.AssociationAccessTokenReader = this.belongsTo(AccessTokenReader, { as: 'accessTokenReader', foreignKey: 'accessTokenReaderId' });
    }
}

UserAccessTokenReader.init({
    userId              : { type: DT.BIGINT, allowNull: false, primaryKey: true },
    accessTokenReaderId : { type: DT.BIGINT, allowNull: false, primaryKey: true },
    position            : { type: DT.BIGINT, allowNull: true, defaultValue: null },
    customName          : { type: DT.STRING, allowNull: true }
}, {
    tableName  : 'UsersAccessTokenReaders',
    timestamps : false,
    sequelize
});

export default UserAccessTokenReader;
