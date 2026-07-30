'use strict';
const TYPESOLD      = {
  RESET_USER_PASSWORD  : 'RESET_USER_PASSWORD',
  RESET_ADMIN_PASSWORD : 'RESET_ADMIN_PASSWORD'
};
const TYPES      = {
  RESET_USER_PASSWORD  : 'RESET_USER_PASSWORD',
  RESET_ADMIN_PASSWORD : 'RESET_ADMIN_PASSWORD',
  LOGIN_ATTEMPTS       : 'LOGIN_ATTEMPTS'
};

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('StoredTriggerableActions', 'type', {
      type: Sequelize.ENUM(Object.values(TYPES)),
      allowNull: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('StoredTriggerableActions', 'type', {
      type: Sequelize.ENUM(Object.values(TYPESOLD)),
      allowNull: false
    });
  }
};
