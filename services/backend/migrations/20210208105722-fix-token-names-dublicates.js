'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const sequelize = queryInterface.sequelize;

    return queryInterface.sequelize.transaction(async () => {
      let offset = 0;
      const limit = 1;
      while (true) {
        const result = await sequelize.query("SELECT `id` FROM `Workspaces` ORDER BY `id` LIMIT :limit OFFSET :offset", {
          nest: true, type: Sequelize.SELECT, replacements: { offset, limit }
        });
        
        if(!result.length) break;

        const tokensResult = await sequelize.query("SELECT `id`, `name`, `workspaceId` FROM `AccessSubjectTokens` WHERE workspaceId IN (:ids) ORDER BY `workspaceId`, `name`, `createdAt`, `id` ", {
          nest: true, type: Sequelize.SELECT, replacements: { ids: result.map(({ id }) => id) }
        });
        const hash = {};
        for(const { id, name, workspaceId } of tokensResult) {
          if (!hash[workspaceId]) hash[workspaceId] = {};
          const lhash = hash[workspaceId];
          if (lhash[name]) {
            for (let i=1; true; ++i) {
              if (!lhash[`${name} (${i})`]) {
                lhash[`${name} (${i})`] = { id, name: `${name} (${i})`, workspaceId };
                break;
              }
            }
          } else {
            lhash[name] = true; // do not change the name
          }
        }

        const toUpdate =  Object.values(hash).map(
          v => Object.values(v).filter(v => typeof v === 'object')
        ).flat();

        for (const {id, name, workspaceId} of toUpdate) {
          await sequelize.query(
            `
                UPDATE AccessSubjectTokens
                SET name = :name
                WHERE workspaceId = :workspaceId AND id = :id
            `,
            {
                replacements: { id, name, workspaceId },
                type: Sequelize.UPDATE
            }
          )
        }

        offset+=limit;
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
  }
};
