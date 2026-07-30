const path = require('path');

const { Sequelize } = require('sequelize');

const mediaCollectingConfig = require('./config/mediaCollecting');
const RtspMediaCollector    = require('./lib/RtspMediaCollector');
const { Logger }            = require('./lib/utils/logger');
const { createSha256Hash }  = require('./lib/utils/common');
const { MS_IN_SECOND }      = require('./lib/constants/common');
const {
    models: {
        sequelize: { AccessCamera, CameraToReaderMap, Workspace }
    }
} = require('./lib/domain-model');

const logger = Logger('[App]');

let rtspMediaCollectors = [];

let checkRtspUrlsChangesInterval = null;

async function getAllCameras({ withAssignedTokenReader = true } = {}) {
    const workspaceIds = (await Workspace.findAll({
        where : {
            allowCollectMedia : true
        },
        raw        : true,
        attributes : [ 'id' ]
    })).map(workspace => workspace.id);

    const options = {
        attributes : [ [ Sequelize.fn('DISTINCT', Sequelize.col('rtspUrl')), 'rtspUrl' ] ],
        where      : {
            workspaceId : workspaceIds,
            enabled     : true,
            isArchived  : false,
            deletedAt   : null
        },
        raw : true
    };

    if (withAssignedTokenReader) {
        options.include = [
            {
                association : AccessCamera.associationCameraToReaderMap,
                attributes  : [],
                required    : true,
                include     : [
                    {
                        association : CameraToReaderMap.associationAccessTokenReader,
                        attributes  : [],
                        required    : true
                    }
                ]
            }
        ];
    }

    const cameras = await AccessCamera.findAll(options);

    return cameras;
}

// Stop media collecting for removed RTSP URLs and start for added
async function processRtspUrlsChanges({ forCamerasWithAssignedTokenReaderOnly }) {
    logger.info('start process URLs changes');

    const cameras                 = await getAllCameras({
        withAssignedTokenReader : forCamerasWithAssignedTokenReaderOnly
    });
    const actualRtspUrls          = cameras.map((camera) => camera.rtspUrl);
    const mediaCollectorsToRemove = rtspMediaCollectors.reduce((acc, mediaCollector) => {
        const url = mediaCollector.getRtspUrl();

        return !actualRtspUrls.includes(url) ? [ ...acc, mediaCollector ] : acc;
    }, []);

    mediaCollectorsToRemove.forEach((mediaCollectorToRemove) => {
        logger.info(`stop process RTSP URL with hash: ${mediaCollectorToRemove.getUrlHash()}`);

        mediaCollectorToRemove.stopCollectMedia();

        rtspMediaCollectors = rtspMediaCollectors.filter((mediaCollector) => mediaCollector !== mediaCollectorToRemove);
    });

    const addedRtspUrls = actualRtspUrls.filter((url) => {
        return !rtspMediaCollectors.find((mediaCollector) => mediaCollector.getRtspUrl() === url);
    });

    logger.info(addedRtspUrls.length ?
        `added RTSP URLs hashes: ${addedRtspUrls.map(createSha256Hash)}` :
        'there are no added RTSP URLs hashes');

    await startCollectCamerasMedia({ rtspUrls: addedRtspUrls });
}

async function startCollectCamerasMedia({ rtspUrls, forCamerasWithAssignedTokenReaderOnly = true } = {}) {
    if (!rtspUrls) {
        const cameras = await getAllCameras({ withAssignedTokenReader: forCamerasWithAssignedTokenReaderOnly });

        rtspUrls = cameras.map((camera) => camera.rtspUrl); // eslint-disable-line no-param-reassign
    }

    for (const url of rtspUrls) {
        // RTSP URL is sensitive data and should be hidden
        const urlHash              = createSha256Hash(url);
        const mediaCollectorLogger = Logger(`RtspMediaCollector(URL hash: ${urlHash})`);
        const mediaCollector       = new RtspMediaCollector(
            url,
            {
                basePathToSave            : path.join(mediaCollectingConfig.mediaDirPath, 'cameras'),
                collectFramesIntervalTime : mediaCollectingConfig.collectFramesIntravalTime,
                videoSegmentTime          : mediaCollectingConfig.videoSegmentTime,
                restartProcessTimeout     : mediaCollectingConfig.restartProccessTimeout
            },
            mediaCollectorLogger
        );

        rtspMediaCollectors.push(mediaCollector);

        await mediaCollector.startCollectMedia();
    }

    if (!checkRtspUrlsChangesInterval) {
        checkRtspUrlsChangesInterval = setInterval(
            () => processRtspUrlsChanges({ forCamerasWithAssignedTokenReaderOnly }),
            mediaCollectingConfig.checkRtspUrlChangesIntervalTime * MS_IN_SECOND
        );
    }
}

function stopCollectCamerasMedia() {
    rtspMediaCollectors.forEach((mediaCollector) => mediaCollector.stopCollectMedia());

    clearInterval(checkRtspUrlsChangesInterval);
}

module.exports = {
    startCollectCamerasMedia,
    stopCollectCamerasMedia
};
