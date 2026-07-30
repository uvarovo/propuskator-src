'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('AccessSubjects', 'virtualCode', {
            type         : Sequelize.STRING(12),
            allowNull    : true
        });
        await queryInterface.addConstraint('AccessSubjects', {
          name: 'AccessSubjects_workspaceId_virtualCode_uk',
          type: 'unique',
          fields: ['workspaceId', 'virtualCode']
        });
    },

    down: async (queryInterface) => {
        await queryInterface.removeConstraint('AccessSubjects', 'AccessSubjects_workspaceId_virtualCode_uk');
        await queryInterface.removeColumn('AccessSubjects', 'virtualCode');
    }
};
