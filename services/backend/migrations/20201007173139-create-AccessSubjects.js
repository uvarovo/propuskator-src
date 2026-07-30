module.exports = {
  up : (queryInterface, DT) => {
    return queryInterface.sequelize.transaction(async t => {
      await queryInterface.createTable('AccessSubjects',
        {
          id             : { type: DT.BIGINT, primaryKey: true, autoIncrement: true },
          workspaceId    : { type: DT.BIGINT, allowNull: false, references: { model: 'Workspaces', key: 'id' }},
          userId         : { type: DT.BIGINT, allowNull: true, references: { model: 'Users', key: 'id' }},
          name           : { type: DT.STRING, allowNull: false },
          enabled        : { type: DT.BOOLEAN, allowNull: false, defaultValue: true },
          isArchived     : { type: DT.BOOLEAN, allowNull: false, defaultValue: false },
          mobileEnabled  : { type: DT.BOOLEAN, allowNull: false, defaultValue: false },
          position       : { type: DT.STRING, allowNull: true },
          email          : { type: DT.STRING, allowNull: true },
          phone          : { type: DT.STRING, allowNull: true },
          avatar         : { type: DT.STRING, allowNull: true },
          avatarColor    : { type: DT.STRING, allowNull: true },
          popularityCoef : { type: DT.INTEGER, allowNull: false, defaultValue: 0 },
          createdAt      : { type: DT.DATE(3), allowNull: false, defaultValue: DT.literal('CURRENT_TIMESTAMP(3)') },
          updatedAt      : { type: DT.DATE(3), allowNull: false, defaultValue : DT.literal('CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)') }
        },
        {
          charset : 'utf8mb4'
        }
      );
      // await queryInterface.addConstraint('AccessSubjects', {
      //   type: 'unique',
      //   fields: ['workspaceId', 'name']
      // });
      await queryInterface.addConstraint('AccessSubjects', {
        type: 'unique',
        fields: ['workspaceId', 'email']
      });
    });
  },

  down : (queryInterface) => {
    return queryInterface.sequelize.transaction(async t => {
      await queryInterface.dropTable('AccessSubjects');
    });
  }
};
