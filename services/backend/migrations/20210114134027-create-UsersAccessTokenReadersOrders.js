module.exports = {
  up : (queryInterface, DT) => {
    return queryInterface.createTable('UsersAccessTokenReadersOrders',
      {
        userId : { type: DT.BIGINT, allowNull: false, primaryKey: true, references: { model: 'Users', key: 'id' } },
        accessTokenReaderId    : { type: DT.BIGINT, allowNull: false, primaryKey: true, references: { model: 'AccessTokenReaders', key: 'id' } },
        position              : { type: DT.BIGINT, allowNull: false, primaryKey: true },
      },
      {
        charset : 'utf8mb4'
      }
    );
  },

  down : (queryInterface) => {
    return queryInterface.dropTable('UsersAccessTokenReadersOrders');
  }
};
