'use strict';

const TABLE_NAME   = 'accesstokentoreaderchangesmap';
const COLUMN_NAME  = 'data';

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.addColumn(TABLE_NAME, COLUMN_NAME, {
            type         : Sequelize.JSON,
            // "A JSON column cannot have a non-NULL default value.":
            // https://dev.mysql.com/doc/refman/5.7/en/json.html
            allowNull    : true 
        });
    },

    down: (queryInterface) => {
        return queryInterface.removeColumn(TABLE_NAME, COLUMN_NAME);
    }
};