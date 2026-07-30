'use strict';

const TABLE_NAME   = 'accesstokentoreaderchangesmap';
const COLUMN_NAME  = 'actionType';
const ACTION_TYPES = [ 'ADD_ACCESS', 'UPDATE_ACCESS', 'REMOVE_ACCESS' ];

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.addColumn(TABLE_NAME, COLUMN_NAME, {
            type         : Sequelize.ENUM(ACTION_TYPES),
            allowNull    : false,
            // need to set 'UPDATE_ACCESS' value for existing rows to send related tokens
            // for removing on firmware, because it's not known for what kind of action this rows was
            // created before adding this column and it will remove them and then refresh rules if there are
            defaultValue : 'UPDATE_ACCESS'
        });
    },

    down: (queryInterface) => {
        return queryInterface.removeColumn(TABLE_NAME, COLUMN_NAME);
    }
};
