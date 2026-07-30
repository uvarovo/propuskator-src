'use strict';

const TABLE_NAME  = 'StoredTriggerableActions';
const COLUMN_NAME = 'type';
const OLD_TYPES   = [ 'RESET_USER_PASSWORD', 'RESET_ADMIN_PASSWORD', 'LOGIN_ATTEMPTS' ];
const NEW_TYPES   = [ 'RESET_USER_PASSWORD', 'RESET_ADMIN_PASSWORD', 'LOGIN_ATTEMPTS', 'USER_REQUEST_REGISTRATION' ];

module.exports = {
    up : (queryInterface, Sequelize) => {
        return queryInterface.changeColumn(TABLE_NAME, COLUMN_NAME, {
            type      : Sequelize.ENUM(NEW_TYPES),
            allowNull : false
        });
    },
    
    down : (queryInterface, Sequelize) => {
        return queryInterface.changeColumn(TABLE_NAME, COLUMN_NAME, {
            type      : Sequelize.ENUM(OLD_TYPES),
            allowNull : false
        });
    }
};
