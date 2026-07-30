const { DataTypes } = require('sequelize');

const { DATE_DATATYPE_PRECISION } = require('../../constants/sequelize');
const BaseModel                   = require('./BaseModel');
const AccessTokenReader           = require('./AccessTokenReader');

class CameraToReaderMap extends BaseModel {
    static initRelations() {
        // Do not create association with AccessCamera to avoid circular dependency, so
        // make an association only in one way: AccessCamera -> CameraToReaderMap -> AccessTokenReader
        this.associationAccessTokenReader = this.belongsTo(AccessTokenReader, {
            as         : 'accessTokenReader',
            foreignKey : 'accessTokenReaderId'
        });
    }

    static schema() {
        return {
            accessCameraId      : { type: DataTypes.BIGINT, allowNull: false, primaryKey: true },
            accessTokenReaderId : { type: DataTypes.BIGINT, allowNull: false, primaryKey: true },
            createdAt           : { type: DataTypes.DATE(DATE_DATATYPE_PRECISION) }
        };
    }

    static options() {
        return {
            tableName  : 'cameratoreadermap',
            timestamps : false
        };
    }
}

module.exports = CameraToReaderMap;
