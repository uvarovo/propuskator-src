'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.renameColumn('AccessCameras', 'lastFailedAttamptAt', 'lastAttemptAt');
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.renameColumn('AccessCameras', 'lastAttemptAt', 'lastFailedAttamptAt');
  }
};
