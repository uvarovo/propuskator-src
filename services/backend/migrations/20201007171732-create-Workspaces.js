module.exports = {
  up : (queryInterface, DT) => {
    return queryInterface.createTable('Workspaces',
      {
        id          : { type: DT.BIGINT, primaryKey: true, autoIncrement: true },
        name        : { type: DT.STRING, allowNull: false, unique: true },
        accessToken : { type: DT.STRING, allowNull: false, unique: true },
        createdAt   : { type: DT.DATE(3), allowNull: false, defaultValue: DT.literal('CURRENT_TIMESTAMP(3)') },
        updatedAt   : { type: DT.DATE(3), allowNull: false, defaultValue: DT.literal('CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)') }
      },
      {
        charset : 'utf8mb4'
      }
    );
  },

  down : (queryInterface) => {
    return queryInterface.dropTable('Workspaces');
  }
};
