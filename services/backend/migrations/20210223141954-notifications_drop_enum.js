'use strict';

module.exports = {
  up: (queryInterface, DT) => {
    return queryInterface.changeColumn('Notifications', 'type', {
      type: DT.STRING,
      allowNull: false,
    });
  },

  down: (queryInterface, DT) => {
    return queryInterface.changeColumn('Notifications', 'type', {
      type: DT.STRING,
      allowNull: false,
    });
  }
};
