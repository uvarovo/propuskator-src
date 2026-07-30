'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('AccessSubjects', 'phoneEnabled', {
      type         : Sequelize.BOOLEAN(),
      allowNull    : false,
      defaultValue : false
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('AccessSubjects', 'phoneEnabled');
  }
};
