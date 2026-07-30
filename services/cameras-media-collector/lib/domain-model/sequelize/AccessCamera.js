const { DataTypes, Op } = require('sequelize');

const { DATE_DATATYPE_PRECISION } = require('../../constants/sequelize');
const BaseModel                   = require('./BaseModel');
const CameraToReaderMap           = require('./CameraToReaderMap');

const RTSP_URL_LENGTH = 2082;

class AccessCamera extends BaseModel {
    static initRelations() {
        this.associationCameraToReaderMap = this.hasMany(CameraToReaderMap, {
            as         : 'cameraToReaderMap',
            foreignKey : 'accessCameraId'
        });
    }

    static schema(sequelize) {
        return {
            id         : { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
            enabled    : { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
            isArchived : { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
            rtspUrl    : { type: DataTypes.STRING(RTSP_URL_LENGTH), allowNull: false },
            createdAt  : { type: DataTypes.DATE(DATE_DATATYPE_PRECISION) },
            updatedAt  : { type: DataTypes.DATE(DATE_DATATYPE_PRECISION) },
            deletedAt  : {
                type         : DataTypes.DATE(DATE_DATATYPE_PRECISION),
                allowNull    : false,
                defaultValue : { [Op.eq]: sequelize.literal('0') }
            }
        };
    }

    static options() {
        return {
            paranoid   : true,
            timestamps : true
        };
    }
}

module.exports = AccessCamera;
