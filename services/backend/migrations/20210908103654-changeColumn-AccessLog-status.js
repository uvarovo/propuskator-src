'use strict';

const TABLE_NAME          = 'accesslogs';
const COLUMN_NAME         = 'status';
const OLD_INITIATOR_TYPES = [ 'SUCCESS', 'DENIED' ];
const NEW_INITIATOR_TYPES = [ 'SUCCESS', 'DENIED', 'ALARM_ON', 'ALARM_OFF' ];

module.exports = {
    up : (queryInterface, Sequelize) => {
        return queryInterface.changeColumn(TABLE_NAME, COLUMN_NAME, {
            type      : Sequelize.ENUM(NEW_INITIATOR_TYPES),
            allowNull : false
        });
    },

    down : (queryInterface, Sequelize) => {
        return queryInterface.changeColumn(TABLE_NAME, COLUMN_NAME, {
            type      : Sequelize.ENUM(OLD_INITIATOR_TYPES),
            allowNull : false
        });
    }
};
