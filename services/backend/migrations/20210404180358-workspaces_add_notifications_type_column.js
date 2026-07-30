'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('workspaces', 'notificationTypes', {
      type         : Sequelize.STRING(),
      allowNull    : false,
      defaultValue : 'USER_ACTIONS/READER_STATE/ACCESS_ATTEMPTS'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('workspaces', 'notificationTypes');
  }
};
