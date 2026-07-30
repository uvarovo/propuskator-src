module.exports = {
  up : (queryInterface, DT) => {
    return queryInterface.sequelize.transaction(async t => {
      await queryInterface.createTable('Users',
        {
          id           : { type: DT.BIGINT, primaryKey: true, autoIncrement: true },
          workspaceId  : { type: DT.BIGINT, allowNull: false, references: { model: 'Workspaces', key: 'id' }},
          // login        : { type: DT.STRING, allowNull: false },
          email        : { type: DT.STRING, allowNull: false },
          passwordHash : { type: DT.STRING, allowNull: false },
          mqttToken    : { type: DT.STRING, allowNull: false },
          createdAt    : { type: DT.DATE(3), allowNull: false, defaultValue: DT.literal('CURRENT_TIMESTAMP(3)') },
          updatedAt    : { type: DT.DATE(3), allowNull: false, defaultValue : DT.literal('CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)') }
        },
        {
          charset : 'utf8mb4'
        }
      );
      await queryInterface.addConstraint('Users', {
        type: 'unique',
        fields: ['workspaceId', 'email']
      });
    });
  },

  down : (queryInterface) => {
    return queryInterface.sequelize.transaction(async t => {
      await queryInterface.dropTable('Users');
    });
  }
};
