module.exports = {
  up : (queryInterface, DT) => {
    const AccessSubjectToken = require('../lib/models/AccessSubjectToken');
    return queryInterface.sequelize.transaction(async t => {
      await queryInterface.createTable('AccessSubjectTokens',
        {
          id              : { type: DT.BIGINT, primaryKey: true, autoIncrement: true },
          workspaceId     : { type: DT.BIGINT, allowNull: false, references: { model: 'Workspaces', key: 'id' }},
          name            : { type: DT.STRING, allowNull: false },
          code            : { type: DT.STRING, allowNull: false },
          enabled         : { type: DT.BOOLEAN, allowNull: false, defaultValue: true },
          isArchived      : { type: DT.BOOLEAN, allowNull: false, defaultValue: false },
          accessSubjectId : { type: DT.BIGINT, allowNull: true, references: { model: 'AccessSubjects', key: 'id' } },
          type            : { type: DT.ENUM(AccessSubjectToken.TYPE_NFC, AccessSubjectToken.TYPE_RFID), allowNull: true },
          assignedAt      : { type: DT.DATE(3), allowNull: true },
          createdAt       : { type: DT.DATE(3), allowNull: false, defaultValue: DT.literal('CURRENT_TIMESTAMP(3)') },
          updatedAt       : { type: DT.DATE(3), allowNull: false, defaultValue : DT.literal('CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)') }
        },
        {
          charset : 'utf8mb4'
        }
      );
      // await queryInterface.addConstraint('AccessSubjectTokens', {
      //   type: 'unique',
      //   fields: ['workspaceId', 'name']
      // });
      await queryInterface.addConstraint('AccessSubjectTokens', {
        type: 'unique',
        fields: ['workspaceId', 'code']
      });
    });
  },

  down : (queryInterface) => {
    return queryInterface.sequelize.transaction(async t => {
      await queryInterface.dropTable('AccessSubjectTokens');
    });
  }
};
