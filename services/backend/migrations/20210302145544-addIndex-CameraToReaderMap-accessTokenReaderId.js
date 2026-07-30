const TABLE_NAME  = 'cameratoreadermap';
const COLUMN_NAME = 'accessTokenReaderId';
const INDEX_NAME  = `${TABLE_NAME}_${COLUMN_NAME}`;

module.exports = {
    up : (queryInterface) => {
        return queryInterface.addIndex(TABLE_NAME, [ COLUMN_NAME ], {
            name   : INDEX_NAME,
            unique : true
        });
    },

    down : (queryInterface) => {
        return queryInterface.removeIndex(TABLE_NAME, INDEX_NAME);
    }
};
