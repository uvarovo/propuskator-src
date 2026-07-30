const { stubFalse } = require("lodash");

module.exports = {
  up : (queryInterface, DT) => {
    return queryInterface.sequelize.transaction(async t => {
      await queryInterface.createTable('AccessReadersGroups',
        {
          id             : { type: DT.BIGINT, primaryKey: true, autoIncrement: true },
          workspaceId    : { type: DT.BIGINT, allowNull: false, references: { model: 'Workspaces', key: 'id' }},
          name           : { type: DT.STRING, allowNull: stubFalse },
          enabled        : { type: DT.BOOLEAN, allowNull: false, defaultValue: true },
          isArchived     : { type: DT.BOOLEAN, allowNull: false, defaultValue: false },
          color          : { type: DT.STRING, allowNull: false },
          popularityCoef : { type: DT.INTEGER, allowNull: false, defaultValue: 0 },
          createdAt      : { type: DT.DATE(3), allowNull: false, defaultValue: DT.literal('CURRENT_TIMESTAMP(3)') },
          updatedAt      : { type: DT.DATE(3), allowNull:false, defaultValue : DT.literal('CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)') }
        },
        {
          charset : 'utf8mb4'
        }
      );
      // await queryInterface.addConstraint('AccessReadersGroups', {
      //   type: 'unique',
      //   fields: ['workspaceId', 'name']
      // });
    });
  },

  down : (queryInterface) => {
    return queryInterface.sequelize.transaction(async t => {
      await queryInterface.dropTable('AccessReadersGroups');
    });
  }
};
