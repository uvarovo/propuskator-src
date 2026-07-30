import { DataTypes as DT } from 'sequelize';
import Base from '../Base';
import sequelize from '../../sequelizeSingleton';
import AccessReadersMobileGroup from '../AccessReadersMobileGroup';
import AccessTokenReader from '../AccessTokenReader';

class MobileGroupToReaderMap extends Base {
    static initRelations() {
        this.AssociationAccessReadersMobileGroup = this.belongsTo(AccessReadersMobileGroup, { as: 'accessReadersMobileGroup', foreignKey: 'groupId' });
        this.AssociationAccessTokenReader = this.belongsTo(AccessTokenReader, { as: 'accessTokenReader', foreignKey: 'accessTokenReaderId' });
    }
}
MobileGroupToReaderMap.init({
    groupId             : { type: DT.BIGINT, allowNull: false, primaryKey: true },
    accessTokenReaderId : { type: DT.BIGINT, allowNull: false, primaryKey: true }
}, {
    tableName  : 'MobileGroupToReaderMap',
    timestamps : false,
    sequelize
});

export default MobileGroupToReaderMap;
