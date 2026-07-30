'use strict';

const TABLE_NAME = 'logs_recorded_videos';

module.exports = {
    up : (queryInterface, Sequelize) => {
        return queryInterface.createTable(TABLE_NAME, {
            logId : {
                type       : Sequelize.BIGINT,
                primaryKey : true,
                references : {
                    model : 'accesslogs',
                    key   : 'id'
                },
                onDelete : 'CASCADE'
            },
            objectKey : { 
                type       : Sequelize.STRING,
                primaryKey : true,
                allowNull  : false
            },
            originCreatedAt : {
                type         : Sequelize.DATE(3),
                allowNull    : false,
                defaultValue : Sequelize.literal('CURRENT_TIMESTAMP(3)'),
                comment      : 'The time when origin file was created on file system'
            }
        });
    },
    
    down : (queryInterface) => {
        return queryInterface.dropTable(TABLE_NAME);
    }
};
