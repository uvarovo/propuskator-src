'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('StoredTriggerableActions', 'ip', {
      type         : Sequelize.STRING(),
      allowNull    : true,
      defaultValue : null
    });
    await queryInterface.addColumn('StoredTriggerableActions', 'updatedAt', {
      type: Sequelize.DATE(3),
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3)')
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('StoredTriggerableActions', 'ip');
    await queryInterface.removeColumn('StoredTriggerableActions', 'updatedAt');
  }
};
