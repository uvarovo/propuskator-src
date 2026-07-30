'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('AccessReadersMobileGroups', 'logoColor', {
      type         : Sequelize.STRING(),
      allowNull    : false,
      defaultValue : '#DFDFDF'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('AccessReadersMobileGroups', 'logoColor');
  }
};
