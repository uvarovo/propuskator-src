'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        return queryInterface.addColumn('Workspaces', 'allowCollectMedia', {
            type         : Sequelize.BOOLEAN,
            allowNull    : false,
            defaultValue : true
        });
    },

    down: async (queryInterface) => {
        return queryInterface.removeColumn('Workspaces', 'allowCollectMedia');
    }
};