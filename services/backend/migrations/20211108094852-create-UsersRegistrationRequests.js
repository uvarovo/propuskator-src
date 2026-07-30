'use strict';

const TABLE_NAME = 'users_registration_requests';

module.exports = {
    up : (queryInterface, Sequelize) => {
        return queryInterface
            .createTable(TABLE_NAME, {
                id          : { type: Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
                workspaceId : { 
                    type       : Sequelize.BIGINT,
                    references : {
                        model : 'workspaces',
                        key   : 'id'
                    },
                    onDelete: 'CASCADE'
                },
                subjectName  : { type: Sequelize.STRING, allowNull: false },
                email        : { type: Sequelize.STRING, allowNull: false },
                subjectPhone : { type: Sequelize.STRING, allowNull: true },
                passwordHash : { type: Sequelize.STRING, allowNull: false },
                createdAt    : { 
                    type         : Sequelize.DATE(3),
                    allowNull    : false,
                    defaultValue : Sequelize.literal('CURRENT_TIMESTAMP(3)')
                },
                deletedAt : { type: Sequelize.DATE(3), allowNull: true }
            })
            .then(() => queryInterface.addConstraint(TABLE_NAME, {
                fields : [ 'workspaceId', 'email', 'deletedAt' ],
                type   : 'unique'
            }));
    },
    
    down : (queryInterface) => {
        return queryInterface.dropTable(TABLE_NAME);
    }
};
