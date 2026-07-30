module.exports = {
  up : (queryInterface, DT) => {
    const AccessTokenReader = require('../lib/models/AccessTokenReader');
    return queryInterface.sequelize.transaction(async t => {
      await queryInterface.createTable('AccessTokenReaders',
        {
          id             : { type: DT.BIGINT, primaryKey: true, autoIncrement: true },
          workspaceId    : { type: DT.BIGINT, allowNull: false, references: { model: 'Workspaces', key: 'id' }},
          name           : { type: DT.STRING, allowNull: false },
          enabled        : { type: DT.BOOLEAN, allowNull: false, defaultValue: true },
          isArchived     : { type: DT.BOOLEAN, allowNull: false, defaultValue: false },
          code           : { type: DT.STRING, allowNull: false },
          stateStatus    : { type: DT.STRING, allowNull: false, defaultValue: AccessTokenReader.STATE_INACTIVE },
          popularityCoef : { type: DT.INTEGER, allowNull: false, defaultValue: 0 },
          activeAt       : { type: DT.DATE(3), allowNull: true },
          createdAt      : { type: DT.DATE(3), allowNull: false, defaultValue: DT.literal('CURRENT_TIMESTAMP(3)') },
          updatedAt      : { type: DT.DATE(3), allowNull:false, defaultValue : DT.literal('CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)') }
        },
        {
          charset : 'utf8mb4'
        }
      );
      // await queryInterface.addConstraint('AccessTokenReaders', {
      //   type: 'unique',
      //   fields: ['workspaceId', 'name']
      // });
      await queryInterface.addConstraint('AccessTokenReaders', {
        type: 'unique',
        fields: ['workspaceId', 'code']
      });
    });
  },

  down : (queryInterface) => {
    return queryInterface.sequelize.transaction(async t => {
      await queryInterface.dropTable('AccessTokenReaders');
    });
  }
};
