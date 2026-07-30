module.exports = {
  up : (queryInterface, DT) => {
    return queryInterface.createTable('AccessTokenToReaderChangesMap',
      {
        accessSubjectTokenCode : { type: DT.STRING, allowNull: false, primaryKey: true },
        accessTokenReaderId    : { type: DT.BIGINT, allowNull: false, primaryKey: true, references: { model: 'AccessTokenReaders', key: 'id' } },
        createdAt              : { type: DT.DATE(3), allowNull: false, defaultValue: DT.literal('CURRENT_TIMESTAMP(3)') },
        updatedAt              : { type: DT.DATE(3), allowNull: false, defaultValue : DT.literal('CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)') }
      },
      {
        charset : 'utf8mb4'
      }
    );
  },

  down : (queryInterface) => {
    return queryInterface.dropTable('AccessTokenToReaderChangesMap');
  }
};
