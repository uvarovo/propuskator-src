module.exports = {
  up : async (queryInterface, DT) => {
    await queryInterface.createTable('AccessCameras',
      {
        id                  : { type: DT.BIGINT, primaryKey: true, autoIncrement: true },
        workspaceId         : { type: DT.BIGINT, allowNull: false, references: { model: 'Workspaces', key: 'id' }},
        name                : { type: DT.STRING, allowNull: false },
        enabled             : { type: DT.BOOLEAN, allowNull: false, defaultValue: true },
        isArchived          : { type: DT.BOOLEAN, allowNull: false, defaultValue: false },
        rtspUrl             : { type: DT.STRING(2082), allowNull: false},
        lastSuccessStreamAt : { type: DT.DATE(3), allowNull: true },
        lastFailedAttamptAt : { type: DT.DATE(3), allowNull: true },
        createdAt           : { type: DT.DATE(3), allowNull: false, defaultValue: DT.literal('CURRENT_TIMESTAMP(3)') },
        updatedAt           : { type: DT.DATE(3), allowNull: false, defaultValue: DT.literal('CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)') },
        deletedAt           : { type: DT.DATE(3), allowNull: false, defaultValue: 0 }
      },
      {
        charset : 'utf8mb4'
      }
    );
  },

  down : async (queryInterface) => {
    await queryInterface.dropTable('AccessCameras');
  }
};
