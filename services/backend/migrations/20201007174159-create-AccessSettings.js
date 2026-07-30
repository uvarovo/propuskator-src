module.exports = {
  up : (queryInterface, DT) => {
    return queryInterface.createTable('AccessSettings',
      {
        id          : { type: DT.BIGINT, primaryKey: true, autoIncrement: true },
        workspaceId : { type: DT.BIGINT, allowNull: false, references: { model: 'Workspaces', key: 'id' }},
        enabled     : { type: DT.BOOLEAN, allowNull: false, defaultValue: true },
        isArchived  : { type: DT.BOOLEAN, allowNull: false, defaultValue: false },
        createdAt   : { type: DT.DATE(3), allowNull: false, defaultValue: DT.literal('CURRENT_TIMESTAMP(3)') },
        updatedAt   : { type: DT.DATE(3), allowNull: false, defaultValue : DT.literal('CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)') }
      },
      {
        charset : 'utf8mb4'
      }
    );
  },

  down : (queryInterface) => {
      return queryInterface.dropTable('AccessSettings');
  }
};
