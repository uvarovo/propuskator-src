'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('Users', 'deletedAt', {
            type         : Sequelize.DATE(3),
            allowNull    : true,
            defaultValue : null
        });
    },

    down: async (queryInterface) => {
        await queryInterface.removeColumn('Users', 'deletedAt');
    }
};
