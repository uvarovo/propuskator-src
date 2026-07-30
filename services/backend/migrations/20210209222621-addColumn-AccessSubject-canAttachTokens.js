'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('AccessSubjects', 'canAttachTokens', {
            type         : Sequelize.BOOLEAN,
            allowNull    : false,
            defaultValue : false
        });
    },

    down: async (queryInterface) => {
        await queryInterface.removeColumn('AccessSubjects', 'canAttachTokens');
    }
};
