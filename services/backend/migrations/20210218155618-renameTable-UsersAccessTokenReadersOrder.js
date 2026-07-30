'use strict';

const OLD_TABLE_NAME = 'UsersAccessTokenReadersOrders';
const NEW_TABLE_NAME = 'UsersAccessTokenReaders';

module.exports = {
    up : (queryInterface) => {
        return queryInterface.renameTable(OLD_TABLE_NAME, NEW_TABLE_NAME);
    },
    down : (queryInterface) => {
        return queryInterface.renameTable(NEW_TABLE_NAME, OLD_TABLE_NAME);
    }
};
