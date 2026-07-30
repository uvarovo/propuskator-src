const { DataTypes, Op } = require('sequelize');

const { DATE_DATATYPE_PRECISION } = require('../../constants/sequelize');
const BaseModel                   = require('./BaseModel');

class AccessTokenReader extends BaseModel {
    static schema(sequelize) {
        return {
            id                : { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
            workspaceId       : { type: DataTypes.BIGINT, allowNull: false },
            name              : { type: DataTypes.STRING, allowNull: false },
            enabled           : { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
            isArchived        : { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
            code              : { type: DataTypes.STRING, allowNull: false },
            phone             : { type: DataTypes.STRING, allowNull: true },
            stateStatus       : { type: DataTypes.STRING, allowNull: false },
            brokerStateStatus : { type: DataTypes.STRING, allowNull: true, defaultValue: null },
            popularityCoef    : { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
            activeAt          : { type: DataTypes.DATE(DATE_DATATYPE_PRECISION), allowNull: true },
            createdAt         : { type: DataTypes.DATE(DATE_DATATYPE_PRECISION) },
            updatedAt         : { type: DataTypes.DATE(DATE_DATATYPE_PRECISION) },
            deletedAt         : {
                type         : DataTypes.DATE(DATE_DATATYPE_PRECISION),
                allowNull    : false,
                defaultValue : { [Op.eq]: sequelize.literal('0') }
            },
            resetRules : { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
        };
    }

    static options() {
        return {
            paranoid   : true,
            timestamps : true,
            createdAt  : false
        };
    }
}

module.exports = AccessTokenReader;
