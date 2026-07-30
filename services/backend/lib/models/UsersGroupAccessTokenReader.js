import { DataTypes as DT } from 'sequelize';

import sequelize                from '../sequelizeSingleton.js';
import Base                     from './Base.js';
import AccessTokenReader        from './AccessTokenReader.js';
import AccessReadersMobileGroup from './AccessReadersMobileGroup.js';

export default class UsersGroupAccessTokenReader extends Base {
    static initRelations() {
        this.associationBelongsToAccessTokenReader = this.belongsTo(AccessTokenReader, {
            foreignKey : 'accessTokenReaderId',
            as         : 'accessTokenReader',
            onDelete   : 'CASCADE'
        });
        this.associationBelongsToAccessReadersMobileGroup = this.belongsTo(AccessReadersMobileGroup, {
            foreignKey : 'accessReadersMobileGroupId',
            as         : 'accessReadersMobileGroup',
            onDelete   : 'CASCADE'
        });
    }
}

UsersGroupAccessTokenReader.init({
    userId : {
        type       : DT.BIGINT,
        primaryKey : true,
        references : {
            model    : 'Users',
            key      : 'id',
            onDelete : 'CASCADE'
        }
    },
    accessTokenReaderId : {
        type       : DT.BIGINT,
        primaryKey : true,
        references : {
            model    : 'AccessTokenReaders',
            key      : 'id',
            onDelete : 'CASCADE'
        }
    },
    accessReadersMobileGroupId : {
        type       : DT.BIGINT,
        primaryKey : true,
        references : {
            model    : 'AccessReadersMobileGroups',
            key      : 'id',
            onDelete : 'CASCADE'
        }
    },
    position : { type: DT.INTEGER.UNSIGNED, allowNull: false }
}, {
    tableName  : 'users_groups_access_token_readers',
    timestamps : false,
    sequelize
});
