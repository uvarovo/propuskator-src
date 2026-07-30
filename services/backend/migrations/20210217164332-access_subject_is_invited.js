'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('accessSubjects', 'isInvited', {
            type         : Sequelize.BOOLEAN(),
            allowNull    : false,
            defaultValue : 0
        });
    },

    down: async (queryInterface) => {
        await queryInterface.removeColumn('accessSubjects', 'isInvited');
    }
};
