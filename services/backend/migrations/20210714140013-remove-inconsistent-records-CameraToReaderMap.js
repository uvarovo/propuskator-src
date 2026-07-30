'use strict';

const AccessCamera      = require('../lib/models/AccessCamera');
const AccessTokenReader = require('../lib/models/AccessTokenReader');
const CameraToReaderMap = require('../lib/models/mappings/CameraToReaderMap');

module.exports = {
    up : (queryInterface) => {
        return queryInterface.sequelize.transaction(async t => {
            const cameraToReaderMaps = await CameraToReaderMap.findAll({ where: {} });

            for (const cameraToReaderMap of cameraToReaderMaps) {
                const relatedAccessCamera = await AccessCamera.findOne({
                    where : {
                        id : cameraToReaderMap.accessCameraId
                    },
                    paranoid : false
                });
                const relatedAccessTokenReader = await AccessTokenReader.findOne({
                    where : {
                        id : cameraToReaderMap.accessTokenReaderId
                    },
                    paranoid : false
                });
                // Sequelize.Model.isSoftDeleted method doesn't work properly because sequelize
                // interpret default value for deleteAt(that is sequelize.literal('0')) as invalid date
                // see details of the realization here: https://github.com/sequelize/sequelize/blob/main/lib/model.js#L4214
                const isRelatedAccessCameraSoftDeleted = !Number.isNaN(relatedAccessCamera.deletedAt.getTime());
                const isRelatedAccessTokenReaderSoftDeleted = 
                    !Number.isNaN(relatedAccessTokenReader.deletedAt.getTime());

                if (isRelatedAccessCameraSoftDeleted || isRelatedAccessTokenReaderSoftDeleted) {
                    await cameraToReaderMap.destroy({ transaction: t });
                }
            }
        });
    },
    
    down : () => {}
};
