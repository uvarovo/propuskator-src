'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        return queryInterface.addColumn('AdminUsers', 'timezone', {
            type         : Sequelize.STRING,
            allowNull    : false,
            defaultValue : '(UTC) Coordinated Universal Time'
        });
    },

    down: async (queryInterface) => {
        return queryInterface.removeColumn('AdminUsers', 'timezone');
    }
};
