'use strict';

module.exports = {
    up : async (queryInterface) => {
        await queryInterface.sequelize.query(
            'UPDATE `accesslogs` ' +
            'SET initiatorType = \'SUBJECT\' ' +
            'WHERE accessSubjectId IS NOT NULL'
        );

        await queryInterface.sequelize.query(
            'UPDATE `accesslogs` ' +
            'SET initiatorType = \'ACCESS_POINT\' ' +
            'WHERE accessSubjectId IS NULL'
        );
    },

    down : (queryInterface) => {
        return queryInterface.sequelize.query(
            'UPDATE `accesslogs` ' +
            'SET initiatorType = NULL'
        );
    }
};
