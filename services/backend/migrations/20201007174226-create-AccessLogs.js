module.exports = {
  up : (queryInterface, DT) => {
    return queryInterface.createTable('AccessLogs',
      {
        id                   : { type: DT.BIGINT, primaryKey: true, autoIncrement: true },
        workspaceId          : { type: DT.BIGINT, allowNull: false, references: { model: 'Workspaces', key: 'id' }},
        accessTokenReaderId  : { type: DT.BIGINT, allowNull: false, references: { model: 'AccessTokenReaders', key: 'id' } },
        accessSubjectTokenId : { type: DT.BIGINT, allowNull: true, references: { model: 'AccessSubjectTokens', key: 'id' } },
        accessSubjectId      : { type: DT.BIGINT, allowNull: true, references: { model: 'AccessSubjects', key: 'id' } },
        status               : { type: DT.ENUM('SUCCESS', 'DENIED'), allowNull: false },
        attemptedAt          : { type: DT.DATE(3), allowNull: false },
        createdAt            : { type: DT.DATE(3), allowNull: false, defaultValue: DT.literal('CURRENT_TIMESTAMP(3)') }
      },
      {
        charset : 'utf8mb4'
      }
    );
  },

  down : (queryInterface) => {
      return queryInterface.dropTable('AccessLogs');
  }
};
