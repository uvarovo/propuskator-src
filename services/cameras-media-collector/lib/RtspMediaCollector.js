const path      = require('path');
const { mkdir } = require('fs/promises');

const { MS_IN_SECOND }                                                                = require('./constants/common');
const { createProcForCollectingRtspFrames, createProcForCollectingRtspVideoSegments } = require('./mediaCollecting');
const { createSha256Hash, hideSensitiveData }                                         = require('./utils/common');

class RtspMediaCollector {
    #rtspUrl;

    #basePathToSave;

    #collectFramesIntervalTime;

    #videoSegmentTime;

    #restartProcTimeoutMs;

    #restartCollectFramesProcTimeout = null;

    #restartCollectVideosProcTimeout = null;

    #logger;

    #urlHash;

    #collectFramesProc = null;

    #collectVideosProc = null;

    constructor(
        rtspUrl,
        { basePathToSave, collectFramesIntervalTime, videoSegmentTime, restartProcessTimeout },
        logger
    ) {
        this.#rtspUrl                   = rtspUrl;
        this.#basePathToSave            = basePathToSave;
        this.#collectFramesIntervalTime = collectFramesIntervalTime;
        this.#videoSegmentTime          = videoSegmentTime;
        this.#restartProcTimeoutMs      = restartProcessTimeout * MS_IN_SECOND;
        this.#logger                    = logger;
        // Need URL's hash to make a valid directory name
        this.#urlHash = createSha256Hash(this.#rtspUrl);
    }

    getRtspUrl() {
        return this.#rtspUrl;
    }

    getUrlHash() {
        return this.#urlHash;
    }

    getDirPathToSaveFrames() {
        return path.join(this.#basePathToSave, this.#urlHash, 'frames');
    }

    getDirPathToSaveVideos() {
        return path.join(this.#basePathToSave, this.#urlHash, 'videos');
    }

    async startCollectMedia() {
        this.#collectFramesProc = await this.#startCollectFrames();
        this.#collectVideosProc = await this.#startCollectVideos();
    }

    stopCollectMedia() {
        this.#stopCollectFrames();
        this.#stopCollectVideos();
    }

    async #startCollectFrames() {
        const dirPathToSave = this.getDirPathToSaveFrames();

        await mkdir(dirPathToSave, { recursive: true });

        this.#logger.info('start collect frames');

        const proc = createProcForCollectingRtspFrames(this.#rtspUrl, {
            dirPathToSave,
            intervalTime : this.#collectFramesIntervalTime
        });

        proc.on('error', (err) =>
            this.#logger.warn(`collect frames proc's error: ${hideSensitiveData(JSON.stringify(err))}`));
        proc.on('exit', (code, signal) => {
            this.#logger.info(`collect frames proc was exited with ${JSON.stringify({ code, signal })}`);

            // if process was not killed manually using this.#stopCollectFrames method try to restart it
            if (this.#collectFramesProc) {
                this.#restartCollectFramesProcTimeout = setTimeout(
                    () => this.#startCollectFrames(),
                    this.#restartProcTimeoutMs
                );
            }
        });

        proc.stderr.on('data', (data) =>
            this.#logger.warn(`collect frames proc's stderr: ${hideSensitiveData(JSON.stringify(data))}`));
        proc.stdout.on('data', (data) =>
            this.#logger.info(`collect frames proc's stdout: ${hideSensitiveData(JSON.stringify(data))}`));

        return proc;
    }

    async #startCollectVideos() {
        const dirPathToSave = this.getDirPathToSaveVideos();

        await mkdir(dirPathToSave, { recursive: true });

        this.#logger.info('start collect video segments');

        const proc = createProcForCollectingRtspVideoSegments(this.#rtspUrl, {
            dirPathToSave,
            segmentDuration : this.#videoSegmentTime
        });

        proc.on('error', (err) =>
            this.#logger.warn(`collect video segment proc's error: ${hideSensitiveData(JSON.stringify(err))}`));
        proc.on('exit', (code, signal) => {
            this.#logger.info(`collect video segments proc was exited with ${JSON.stringify({ code, signal })}`);

            // if process was not killed manually using this.#stopCollectVideos method try to restart it
            if (this.#collectVideosProc) {
                this.#restartCollectVideosProcTimeout = setTimeout(
                    () => this.#startCollectVideos(),
                    this.#restartProcTimeoutMs
                );
            }
        });

        proc.stderr.on('data', (data) =>
            this.#logger.warn(`collect video segments proc's stderr: ${hideSensitiveData(JSON.stringify(data))}`));
        proc.stdout.on('data', (data) =>
            this.#logger.info(`collect video segments proc's stdout: ${hideSensitiveData(JSON.stringify(data))}`));

        return proc;
    }

    async #stopCollectFrames() {
        if (!this.#collectFramesProc) return;

        this.#logger.info('kill collect frames proc');

        if (this.#restartCollectFramesProcTimeout) clearTimeout(this.#restartCollectFramesProcTimeout);

        this.#restartCollectFramesProcTimeout = null;

        if (this.#collectFramesProc.exitCode === null) this.#collectFramesProc.kill();

        this.#collectFramesProc = null;
    }

    async #stopCollectVideos() {
        if (!this.#collectVideosProc) return;

        this.#logger.info('kill collect video segments proc');

        if (this.#restartCollectVideosProcTimeout) clearTimeout(this.#restartCollectVideosProcTimeout);

        this.#restartCollectVideosProcTimeout = null;

        if (this.#collectVideosProc.exitCode === null) this.#collectVideosProc.kill();

        this.#collectVideosProc = null;
    }
}

module.exports = RtspMediaCollector;
