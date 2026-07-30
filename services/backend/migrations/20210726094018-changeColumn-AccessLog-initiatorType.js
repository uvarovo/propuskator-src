'use strict';

const TABLE_NAME          = 'accesslogs';
const COLUMN_NAME         = 'initiatorType';
const OLD_INITIATOR_TYPES = [ 'PHONE', 'SUBJECT', 'ACCESS_POINT' ];
const NEW_INITIATOR_TYPES = [ 'PHONE', 'SUBJECT', 'ACCESS_POINT', 'BUTTON' ];

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
            allowNull : true
        });
    }
};
