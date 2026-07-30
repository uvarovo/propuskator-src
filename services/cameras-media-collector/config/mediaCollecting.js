module.exports = {
    mediaDirPath                                      : process.env.MEDIA_DIR_PATH || '/app/media',
    collectFramesIntravalTime                         : +process.env.CAMERAS_MEDIA_COLLECT_FRAMES_INTERVAL_TIME || 60,
    videoSegmentTime                                  : +process.env.CAMERAS_MEDIA_VIDEO_SEGMENT_TIME || 60,
    restartProccessTimeout                            : +process.env.CAMERAS_MEDIA_RESTART_PROCESSES_TIMEOUT || 30,
    checkRtspUrlChangesIntervalTime                   : +process.env.CHECK_RTSP_URL_CHANGES_INTERVAL_TIME || 300,
    collectMediaForCamerasWithAssignedTokenReaderOnly :
        process.env.CAMERAS_MEDIA_COLLECT_FOR_CAMERAS_WITH_ASSIGNED_TOKEN_READER === 'true'
};
