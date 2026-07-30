'use strict';

module.exports = {
    up: async (queryInterface, DT) => {
        return queryInterface.changeColumn('Notifications', 'type', {
            type: DT.ENUM(
                'UNAUTH_SUBJECT_ACCESS',
                'UNAUTH_ACCESS',
                'UNKNOWN_TOKEN',
                'NEW_READER',
                'INACTIVE_READER',
                'ACTIVE_READER',
                'SUBJECT_ATTACHED_TOKEN',
                'SUBJECT_DETACHED_TOKEN'
            ),
            allowNull: false
        });
    },

    down: async (queryInterface, DT) => {
      return queryInterface.changeColumn('Notifications', 'type', {
          type         : DT.STRING,
          allowNull    : false
      });
    }
};
