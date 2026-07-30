'use strict';

module.exports = {
  up: (queryInterface, DT) => {
    return queryInterface.changeColumn('AccessCameras', 'updatedAt', {
      type: DT.DATE(3),
      defaultValue: DT.literal('CURRENT_TIMESTAMP(3)')
    });
  },

  down: (queryInterface, DT) => {
    return queryInterface.changeColumn('AccessCameras', 'updatedAt', {
      type: DT.DATE(3),
      defaultValue: DT.literal('CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)')
    });
  }
};
