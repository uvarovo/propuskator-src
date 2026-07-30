module.exports = {
  up : (queryInterface, Sequelize) => {
      return queryInterface.createTable('reported_issues', {
          id         : { type: Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
          type       : { type: Sequelize.STRING, allowNull: false },
          status     : { type: Sequelize.STRING, allowNull: false },
          message    : { type: Sequelize.TEXT, allowNull: false },
          adminId    : { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
          userId     : { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
          createdAt  : { type: Sequelize.DATE, allowNull: false },
          updatedAt  : { type: Sequelize.DATE, allowNull: false }
      });
  },

  down : (queryInterface) => {
      return queryInterface.dropTable('reported_issues');
  }
};
