module.exports = {
  up : (queryInterface, DT) => {
    return queryInterface.createTable('mobileGroupToReaderMap',
      {
        groupId  : { type: DT.BIGINT, allowNull: false, primaryKey: true, references: { model: 'AccessReadersMobileGroups', key: 'id' }, onDelete: 'cascade' },
        accessTokenReaderId : { type: DT.BIGINT, allowNull: false, primaryKey: true, references: { model: 'AccessTokenReaders', key: 'id' }, onDelete: 'cascade' },
      },
      {
        charset : 'utf8mb4'
      }
    );
  },

  down : (queryInterface) => {
      return queryInterface.dropTable('mobileGroupToReaderMap');
  }
};
