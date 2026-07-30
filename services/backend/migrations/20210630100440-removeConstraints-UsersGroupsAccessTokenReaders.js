'use strict';

const TABLE_NAME                                     = 'users_groups_access_token_readers';
const USER_ID_CONSTRAINT_NAME                        = 'users_groups_access_token_readers_ibfk_1';
const ACCESS_TOKEN_READER_ID_CONSTRAINT_NAME         = 'users_groups_access_token_readers_ibfk_2';
const ACCESS_READERS_MOBILE_GROUP_ID_CONSTRAINT_NAME = 'users_groups_access_token_readers_ibfk_3';

module.exports = {
    up : async (queryInterface) => {
        await queryInterface.removeConstraint(TABLE_NAME, USER_ID_CONSTRAINT_NAME);
        await queryInterface.removeConstraint(TABLE_NAME, ACCESS_TOKEN_READER_ID_CONSTRAINT_NAME);
        await queryInterface.removeConstraint(TABLE_NAME, ACCESS_READERS_MOBILE_GROUP_ID_CONSTRAINT_NAME);
    },

    down : async (queryInterface) => {
        await queryInterface.addConstraint(TABLE_NAME, [ 'userId' ], {
            type : 'FOREIGN KEY',
            name : USER_ID_CONSTRAINT_NAME,
            references : {
                table : 'users',
                field : 'id'
            }
        });
        await queryInterface.addConstraint(TABLE_NAME, [ 'accessTokenReaderId' ], {
            type : 'FOREIGN KEY',
            name : ACCESS_TOKEN_READER_ID_CONSTRAINT_NAME,
            references : {
                table : 'accesstokenreaders',
                field : 'id'
            }
        });
        await queryInterface.addConstraint(TABLE_NAME, [ 'accessReadersMobileGroupId' ], {
            type : 'FOREIGN KEY',
            name : ACCESS_READERS_MOBILE_GROUP_ID_CONSTRAINT_NAME,
            references : {
                table : 'accessreadersmobilegroups',
                name  : 'id'
            }
        });
    }
};
