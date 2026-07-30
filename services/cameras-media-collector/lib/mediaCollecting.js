const { execFile } = require('child_process'); // eslint-disable-line security/detect-child-process

function createProcForCollectingRtspFrames(rtspUrl, { dirPathToSave, intervalTime = 60, frameExtension = 'png' }) {
    return execFile(
        'ffmpeg',
        [
            '-rtsp_transport', 'tcp',
            '-loglevel', 'level+warning',
            '-i', rtspUrl,
            '-vf', `fps=1/${intervalTime}`,
            '-hide_banner',
            '-strftime', '1', `%s000.${frameExtension}`
        ],
        {
            cwd : dirPathToSave
        }
    );
}

function createProcForCollectingRtspVideoSegments(
    rtspUrl,
    { dirPathToSave, segmentDuration = 60, videoExtension = 'mp4' }
) {
    return execFile(
        'ffmpeg',
        [
            '-rtsp_transport', 'tcp',
            '-loglevel', 'level+warning',
            '-i', rtspUrl,
            '-c', 'copy',
            // Most of modern browsers support H.264 encoding:
            // https://stackoverflow.com/questions/23325358/html-video-player-plays-sound-but-not-video
            // Is not used for now as it is enough expensive process that spawn a several threads
            // '-vcodec', 'libx264',
            // Use AAC codec because ffmpeg doesn't support PCM(pcm_alaw, pcm_s16le, etc) in MP4 container:
            // https://stackoverflow.com/questions/47495713/could-not-find-tag-for-codec-pcm-alaw-in-stream-1-codec-not-currently-supporte
            '-acodec', 'aac',
            '-preset', 'ultrafast',
            '-tune', 'zerolatency',
            '-qp', '10',
            '-f', 'segment',
            '-segment_time', segmentDuration,
            '-reset_timestamps', '1',
            '-hide_banner',
            '-strftime', '1', `%s000.${videoExtension}`
        ],
        {
            cwd : dirPathToSave
        }
    );
}

module.exports = {
    createProcForCollectingRtspFrames,
    createProcForCollectingRtspVideoSegments
};
