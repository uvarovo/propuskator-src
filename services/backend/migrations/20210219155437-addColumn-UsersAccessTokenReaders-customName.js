'use strict';

const TABLE_NAME  = 'UsersAccessTokenReaders';
const COLUMN_NAME = 'customName';

module.exports = {
    up : (queryInterface, Sequelize) => {
        return queryInterface.addColumn(TABLE_NAME, COLUMN_NAME, {
            type      : Sequelize.STRING,
            allowNull : true
        });
    },

    down : (queryInterface) => {
        return queryInterface.removeColumn(TABLE_NAME, COLUMN_NAME);
    }
};
