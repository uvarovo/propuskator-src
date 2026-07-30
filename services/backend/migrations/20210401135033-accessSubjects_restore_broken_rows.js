'use strict';

module.exports = {
  up: async (queryInterface) => {
    const [brokenSubjects] = await queryInterface.sequelize.query(`
      select accesssubjects.id as accessSubjectId, users.id as userId from accesssubjects
        inner join users on accesssubjects.email = users.email
        where users.deletedAt is not null
        and accesssubjects.userId is null
    `);

    for (let subj of brokenSubjects) {
      await queryInterface.sequelize.query(`UPDATE accesssubjects SET userId = ${subj.userId} where id = ${subj.accessSubjectId}`)
    }
  },

  down: async () => {}
};
