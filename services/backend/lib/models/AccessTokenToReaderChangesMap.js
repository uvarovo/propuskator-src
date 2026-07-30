import { DataTypes as DT } from 'sequelize';
import sequelize from '../sequelizeSingleton';
import { ACTION_TYPES } from '../constants/accessTokenToReaderChangesMap.js';
import Base from './Base';
import AccessTokenReader from './AccessTokenReader';

class AccessTokenToReaderChangesMap extends Base {
    static initRelations() {
        this.AssociationAccessTokenReader = this.belongsTo(AccessTokenReader, {
            as         : 'accessTokenReader',
            foreignKey : 'accessTokenReaderId'
        });
    }

    static async addUpdates({ accessTokenReaderIds, accessSubjectTokenCodes, actionType, data }, options) {
        const tokenToReaderChanges = [];

        for (const accessSubjectTokenCode of accessSubjectTokenCodes) {
            for (const accessTokenReaderId of accessTokenReaderIds) {
                tokenToReaderChanges.push({ accessSubjectTokenCode, accessTokenReaderId, actionType, data });
            }
        }

        if (tokenToReaderChanges.length) {
            await AccessTokenToReaderChangesMap.bulkCreate(tokenToReaderChanges, {
                transaction       : options.transaction,
                // don't create new record on each new action while reader doesn't sync rules:
                // only keep last(actual) action to do with token
                updateOnDuplicate : [ 'updatedAt', 'actionType', 'data' ]
            });
        }
    }
}
AccessTokenToReaderChangesMap.init(
    {
        accessSubjectTokenCode : { type: DT.STRING, allowNull: false, primaryKey: true },
        accessTokenReaderId    : { type: DT.BIGINT, allowNull: false, primaryKey: true },
        actionType             : {
            type         : DT.ENUM(Object.values(ACTION_TYPES)),
            allowNull    : false,
            // need to set 'UPDATE_ACCESS' value for existing rows to send related tokens
            // for removing on firmware, because it's not known for what kind of action this rows was
            // created before adding this column and it will remove them and then refresh rules if there are
            defaultValue : ACTION_TYPES.UPDATE_ACCESS
        },
        data      : { type: DT.JSON, allowNull: true },
        createdAt : { type: DT.DATE(3) },
        updatedAt : { type: DT.DATE(3) }
    },
    {
        tableName  : 'AccessTokenToReaderChangesMap',
        timestamps : false,
        sequelize
    }
);

export default AccessTokenToReaderChangesMap;
