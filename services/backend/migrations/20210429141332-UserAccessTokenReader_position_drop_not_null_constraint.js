'use strict';

module.exports = {
  up: async (queryInterface, DT) => {
      await queryInterface.sequelize.query(
        'ALTER TABLE UsersAccessTokenReaders DROP FOREIGN KEY usersaccesstokenreaders_ibfk_1;'
      );
      await queryInterface.sequelize.query(
        'ALTER TABLE UsersAccessTokenReaders DROP FOREIGN KEY usersaccesstokenreaders_ibfk_2;'
      );

      await queryInterface.sequelize.query(
       'ALTER TABLE UsersAccessTokenReaders DROP PRIMARY KEY, add PRIMARY KEY(accessTokenReaderId, userId);'
      );
      await queryInterface.sequelize.query(
        'ALTER TABLE UsersAccessTokenReaders ADD CONSTRAINT usersaccesstokenreaders_ibfk_1 FOREIGN KEY (userId) REFERENCES users(id);'
      );
      await queryInterface.sequelize.query(
        'ALTER TABLE UsersAccessTokenReaders ADD CONSTRAINT usersaccesstokenreaders_ibfk_2 FOREIGN KEY (accessTokenReaderId) REFERENCES accessTokenReaders(id);'
      );
      await queryInterface.changeColumn('UsersAccessTokenReaders', 'position', {
        type: DT.BIGINT,
        allowNull: true,
      });
  },

  down: async () => {}
};
