'use strict';

const TABLE_NAME = 'users_groups_access_token_readers';

module.exports = {
    up : (queryInterface, Sequelize) => {
        return queryInterface.createTable(TABLE_NAME, {
            userId : {
                type       : Sequelize.BIGINT,
                primaryKey : true,
                references : {
                    model    : 'users',
                    key      : 'id',
                    onDelete : 'CASCADE'
                }
            },
            accessTokenReaderId : {
                type       : Sequelize.BIGINT,
                primaryKey : true,
                references : {
                    model    : 'accesstokenreaders',
                    key      : 'id',
                    onDelete : 'CASCADE'
                }
            },
            accessReadersMobileGroupId : {
                type       : Sequelize.BIGINT,
                primaryKey : true,
                references : {
                    model    : 'accessreadersmobilegroups',
                    key      : 'id',
                    onDelete : 'CASCADE'
                }
            },
            position : { type: Sequelize.INTEGER.UNSIGNED, allowNull: false }
        });
    },

    down : (queryInterface) => {
        return queryInterface.dropTable(TABLE_NAME);
    }
};
