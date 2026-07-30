'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('AccessSubjects', 'showReaderGroups', {
      type         : Sequelize.BOOLEAN(),
      allowNull    : false,
      defaultValue : false
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('AccessSubjects', 'showReaderGroups');
  }
};
