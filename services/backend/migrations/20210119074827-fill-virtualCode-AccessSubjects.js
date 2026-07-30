'use strict';


const { customAlphabet } = require('nanoid');
// const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', 12);
const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 12);

module.exports = {
    up: async (queryInterface, Sequelize) => {
      const sequelize = queryInterface.sequelize;

      return queryInterface.sequelize.transaction(async () => {
        const result = await sequelize.query("SELECT * FROM `AccessSubjects`", { nest: true, type: Sequelize.SELECT });

        for(const { id } of result) {
          await sequelize.query("UPDATE `AccessSubjects` SET `virtualCode` = :virtualCode WHERE id = :id", {
            type: Sequelize.UPDATE,
            replacements: { id, virtualCode: nanoid() }
          });
        }
      });
    },

    down: async (queryInterface) => {
      const sequelize = queryInterface.sequelize;
      await sequelize.query("UPDATE `AccessSubjects` SET `virtualCode` = NULL");
    }
};
