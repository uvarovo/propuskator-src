'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('AccessTokenReaders', 'phone', {
      type         : Sequelize.STRING(),
      allowNull    : true,
      defaultValue : null
    });
    await queryInterface.addConstraint('AccessTokenReaders', {
      type: 'unique',
      fields: ['workspaceId', 'phone', 'deletedAt']
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      'ALTER TABLE AccessTokenReaders DROP INDEX AccessTokenReaders_workspaceId_phone_uk;'
    );
    await queryInterface.removeColumn('AccessTokenReaders', 'phone');
  }
};
