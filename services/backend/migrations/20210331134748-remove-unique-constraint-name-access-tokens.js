'use strict';

module.exports = {
  up: (queryInterface) => {
    return queryInterface.sequelize.query(`ALTER TABLE accessSubjectTokens 
      DROP INDEX AccessSubjectTokens_workspaceId_name_deletedAt_uk;`);
  },

  down: (queryInterface) => {
    return queryInterface.sequelize.query(`CREATE UNIQUE INDEX AccessSubjectTokens_workspaceId_name_deletedAt_uk
      ON accessSubjectTokens (workspaceId, name, deletedAt);`)
  }
};
