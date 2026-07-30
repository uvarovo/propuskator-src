module.exports = {
  up : (queryInterface, DT) => {
    return queryInterface.createTable('Notifications',
      {
        id                   : { type: DT.BIGINT, primaryKey: true, autoIncrement: true },
        workspaceId          : { type: DT.BIGINT, allowNull: false, references: { model: 'Workspaces', key: 'id' }},
        accessSubjectTokenId : { type: DT.BIGINT, allowNull: true, references: { model: 'AccessSubjectTokens', key: 'id' } },
        accessSubjectId      : { type: DT.BIGINT, allowNull: true, references: { model: 'AccessSubjects', key: 'id' } },
        accessTokenReaderId  : { type: DT.BIGINT, allowNull: true, references: { model: 'AccessTokenReaders', key: 'id' } },
        data                 : { type: DT.JSON, allowNull: true },
        type                 : { type: DT.STRING, allowNull: false },
        message              : { type: DT.STRING, allowNull: false },
        isRead               : { type: DT.BOOLEAN, allowNull: false, defaultValue: false },
        createdAt            : { type: DT.DATE(3), allowNull: false, defaultValue: DT.literal('CURRENT_TIMESTAMP(3)') },
        updatedAt            : { type: DT.DATE(3), allowNull: false, defaultValue : DT.literal('CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)') }
      },
      {
        charset : 'utf8mb4'
      }
    );
  },

  down : (queryInterface) => {
    return queryInterface.dropTable('Notifications');
  }
};
