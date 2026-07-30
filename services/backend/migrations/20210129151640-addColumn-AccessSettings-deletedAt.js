'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('AccessSettings', 'deletedAt', {
            type         : Sequelize.DATE(3),
            allowNull    : false,
            defaultValue : 0
        });
    },

    down: async (queryInterface) => {
        await queryInterface.removeColumn('AccessSettings', 'deletedAt');
    }
};
