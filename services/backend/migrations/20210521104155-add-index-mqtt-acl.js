const TABLE_NAME  = 'mqtt_acl';
const COLUMN_NAME = 'username';
const INDEX_NAME  = `${TABLE_NAME}_${COLUMN_NAME}`;

module.exports = {
    up : (queryInterface) => {
        return queryInterface.addIndex(TABLE_NAME, [ COLUMN_NAME ], { name: INDEX_NAME });
    },

    down : (queryInterface) => {
        return queryInterface.removeIndex(TABLE_NAME, INDEX_NAME);
    }
};
