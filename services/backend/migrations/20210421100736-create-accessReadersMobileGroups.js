module.exports = {
  up : (queryInterface, DT) => {
    return queryInterface.createTable('AccessReadersMobileGroups',
      {
        id                  : { type: DT.BIGINT, primaryKey: true, autoIncrement: true },
        name                : { type: DT.STRING, allowNull: false },
        logoType            : { type: DT.STRING, allowNull: true },
        accessSubjectId     : { type: DT.BIGINT, allowNull: false, references: { model: 'AccessSubjects', key: 'id' } },
        createdAt           : { type: DT.DATE(3), allowNull: false, defaultValue: DT.literal('CURRENT_TIMESTAMP(3)') },
        updatedAt           : { type: DT.DATE(3), allowNull: false, defaultValue: DT.literal('CURRENT_TIMESTAMP(3)') }
      },
      {
        charset : 'utf8mb4'
      }
    );
  },

  down : (queryInterface) => {
      return queryInterface.dropTable('AccessReadersMobileGroups');
  }
};
