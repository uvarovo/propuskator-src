'use strict';

const TABLE_NAME                             = 'cameratoreadermap';
const ACCESS_CAMERA_ID_CONSTRAINT_NAME       = 'cameratoreadermap_ibfk_1';
const ACCESS_TOKEN_READER_ID_CONSTRAINT_NAME = 'cameratoreadermap_ibfk_2';

module.exports = {
    up : async (queryInterface) => {
        await queryInterface.removeConstraint(TABLE_NAME, ACCESS_CAMERA_ID_CONSTRAINT_NAME);
        await queryInterface.removeConstraint(TABLE_NAME, ACCESS_TOKEN_READER_ID_CONSTRAINT_NAME);
    },
    
    down : async (queryInterface) => {
        await queryInterface.addConstraint(TABLE_NAME, [ 'accessCameraId' ], {
            type       : 'FOREIGN KEY',
            name       : ACCESS_CAMERA_ID_CONSTRAINT_NAME,
            references : {
                table : 'accesscameras',
                field : 'id'
            }
        });
        await queryInterface.addConstraint(TABLE_NAME, [ 'accessTokenReaderId' ], {
            type       : 'FOREIGN KEY',
            name       : ACCESS_TOKEN_READER_ID_CONSTRAINT_NAME,
            references : {
                table : 'accesstokenreaders',
                field : 'id'
            }
        });
    }
};
