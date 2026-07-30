module.exports = {
  up : (queryInterface, DT) => {
    return queryInterface.createTable('SettingToSubjectMap',
      {
        accessSettingId : { type: DT.BIGINT, allowNull: false, primaryKey: true, references: { model: 'AccessSettings', key: 'id' } },
        accessSubjectId : { type: DT.BIGINT, allowNull: false, primaryKey: true, references: { model: 'AccessSubjects', key: 'id' } },
        createdAt       : { type: DT.DATE(3), allowNull: false, defaultValue: DT.literal('CURRENT_TIMESTAMP(3)') }
      },
      {
        charset : 'utf8mb4'
      }
    );
  },

  down : (queryInterface) => {
    return queryInterface.dropTable('SettingToSubjectMap');
  }
};
