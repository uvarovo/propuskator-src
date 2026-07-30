'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('workspaces', 'timezone', {
      type         : Sequelize.STRING,
      allowNull    : false,
      defaultValue : '(UTC) Coordinated Universal Time'
    });

    const [adminUsers] = await queryInterface.sequelize.query('SELECT timezone, workspaceId from adminUsers');

    for (let user of adminUsers) {
      await queryInterface.sequelize.query(`UPDATE workspaces SET timezone = "${user.timezone}" where id = ${user.workspaceId};`);
    }

    await queryInterface.removeColumn('adminUsers', 'timezone');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('AdminUsers', 'timezone', {
      type         : Sequelize.STRING,
      allowNull    : false,
      defaultValue : '(UTC) Coordinated Universal Time'
    });
  
    const [workspaces] = await queryInterface.sequelize.query('SELECT timezone, id from workspaces');

    for (let workspace of workspaces) {
      await queryInterface.sequelize.query(`UPDATE adminUsers SET timezone = "${workspace.timezone}" where workspaceId = ${workspace.id};`)
    }

    await queryInterface.removeColumn('workspaces', 'timezone');
  }
};
