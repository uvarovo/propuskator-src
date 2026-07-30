'use strict';

const TYPE_COLUMN = 'type'; // type column name

module.exports = {
    up: async (queryInterface, Sequelize) => {
        return queryInterface.addColumn('AccessTokenReaders', 'resetRules', {
            type         : Sequelize.BOOLEAN,
            allowNull    : false,
            defaultValue : true
        });
    },

    down: async (queryInterface) => {
        return queryInterface.removeColumn('AccessTokenReaders', 'resetRules');
    }
};
