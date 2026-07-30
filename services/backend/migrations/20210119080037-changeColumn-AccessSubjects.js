'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        return queryInterface.changeColumn('AccessSubjects', 'virtualCode', {
            type         : Sequelize.STRING(12),
            allowNull    : false
        });
    },

    down: async (queryInterface, Sequelize) => {
      return queryInterface.changeColumn('AccessSubjects', 'virtualCode', {
          type         : Sequelize.STRING(12),
          allowNull    : true
      });
    }
};
