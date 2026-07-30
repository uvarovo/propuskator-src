'use strict';

const TABLE_NAME = 'readers_displayed_topics';

module.exports = {
    up : (queryInterface, Sequelize) => {
        return queryInterface.createTable(TABLE_NAME, {
            workspaceId : {
                type       : Sequelize.BIGINT,
                primaryKey : true,
                references : {
                    model : 'workspaces',
                    key   : 'id'
                },
                onDelete : 'CASCADE'
            },
            accessTokenReaderId : {
                type       : Sequelize.BIGINT,
                primaryKey : true,
                references : {
                    model : 'accesstokenreaders',
                    key   : 'id'
                },
                onDelete : 'CASCADE'
            },
            topic : {
                type       : Sequelize.STRING,
                primaryKey : true,
                allowNull  : false
            }
        });
    },
    
    down : (queryInterface) => {
        return queryInterface.dropTable(TABLE_NAME);
    }
};
