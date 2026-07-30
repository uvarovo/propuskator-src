import { DataTypes as DT } from 'sequelize';

import sequelize from '../sequelizeSingleton.js';
import Base      from './Base.js';
import AccessLog from './AccessLog.js';

export default class LogRecordedVideo extends Base {
    static initRelations() {
        this.associationBelongsToAccessLog = this.belongsTo(AccessLog, {
            foreignKey : 'logId',
            as         : 'log',
            onDelete   : 'CASCADE'
        });
    }
}

LogRecordedVideo.init({
    logId : {
        type       : DT.BIGINT,
        primaryKey : true,
        references : {
            model : 'accesslogs',
            key   : 'id'
        },
        onDelete : 'CASCADE'
    },
    objectKey : {
        type       : DT.STRING,
        primaryKey : true,
        allowNull  : false
    },
    // The time when origin file was created on file systeme
    originCreatedAt : {
        type         : DT.DATE(3),
        allowNull    : false,
        defaultValue : sequelize.literal('CURRENT_TIMESTAMP(3)')
    }
}, {
    tableName  : 'logs_recorded_videos',
    timestamps : false,
    sequelize
});
