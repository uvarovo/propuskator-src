/* eslint-disable func-style */
import EventEmitter  from 'events';
import { promisify } from 'util';
import childProcess  from 'child_process';
import fs            from 'fs';
import path          from 'path';
import _chunk        from 'lodash/chunk';

import { createHash }        from '../models/utils';
import { hideSensitiveData } from '../utils/hideSensitiveData';
import { initLogger }        from './../extensions/Logger';
import AccessCamera          from './../models/AccessCamera';
import {
    checkStreamInterval,
    intervals,
    failedCheckStreamRetries,
    collectFrames as collectFramesConfig
} from './../config';

// TODO: make a single module with common utils
const execFile = promisify(childProcess.execFile);

class CamerasManager extends EventEmitter {
    constructor({
        collectFramesIntervalTime,
        collectFramesConcurrentProcsNumber,
        collectFramesProcTimeout,
        frameExtension = 'jpg',
        debug
    } = {}) {
        super();

        this.collectFramesIntervalTime = collectFramesIntervalTime;
        this.collectFramesConcurrentProcsNumber = collectFramesConcurrentProcsNumber;
        this.collectFramesProcTimeout = collectFramesProcTimeout;
        this.frameExtension = frameExtension;
        this.debug = debug;

        this.collectFramesInterval = null;
    }

    async init({ framesDirPath } = {}) {
        this.framesDirPath = framesDirPath;

        await this.startCollectFrames();
        this.debug.info('Initialized');
    }

    async destroy() {
        clearInterval(this.collectFramesInterval);
        this.debug.info('Destroyed');
    }

    async startCollectFrames() {
        this.collectFramesInterval = setInterval(
            () => this.collectFrames(),
            this.collectFramesIntervalTime
        );

        await this.collectFrames();
    }

    async collectFrame(rtspUrl) {
        const frameFileName = this.getFrameFileName(rtspUrl);
        // Options description(to see detailed docs visit: http://ffmpeg.org/ffmpeg.html):
        // "-rtsp_transport tcp" - use TCP as transport protocol to avoid packets loss
        // "-y" - overwrite output file
        // "-hide_banner" - suppress printing banner
        // "-i" - input url
        // "-vframes 1" - set the number of video frames to output to 1
        // Important note: ffmpeg writes all output to stderr by default
        const { stderr } = await execFile('ffmpeg',
            [
                '-rtsp_transport',
                'tcp',
                '-y',
                '-hide_banner',
                '-i', rtspUrl,
                '-vframes', '1',
                frameFileName
            ],
            {
                cwd     : this.framesDirPath,
                timeout : this.collectFramesProcTimeout
            });

        return stderr;
    }

    async collectFrames() {
        const accessCameras = await AccessCamera.findAll({
            where : {
                enabled    : true,
                isArchived : false
            }
        });
        // split all cameras on the chunks that will be executed in parallel
        // to reduce CPU usage and don't make a lot of concurrent processes
        const accessCamerasChunks = _chunk(accessCameras, this.collectFramesConcurrentProcsNumber);

        for (const camerasChunk of accessCamerasChunks) {
            const collectFramesTasks = camerasChunk.map(async camera => {
                try {
                    await camera.update({ lastAttemptAt: Date.now() }, { silent: true });
                    if (this._checkDisconnectStatus(camera)) await this._setDisconnectStatus(camera);

                    const output = await this.collectFrame(camera.rtspUrl);
                    const hideOutput = hideSensitiveData(output);

                    await this._setCameraReadyStatus(camera);
                    this.debug.info(`Successfully collected frame for camera with id: "${camera.id}", output: ${hideOutput}`);
                } catch (err) {
                    this.debug.warn(`Error with collecting frame for camera with id: "${camera.id}", error: ${hideSensitiveData(err.message)}`);
                }
            });

            await Promise.all(collectFramesTasks);
        }
    }

    async _setCameraReadyStatus(camera) {
        this.debug.info(`camera - ${camera.id} is alive`);

        await camera.update({
            lastSuccessStreamAt : Date.now(),
            status              : AccessCamera.statuses.READY
        }, { silent: true });
    }

    /**
     * Removes frame(or frames, if frame was saved with different extensions) for the current
     * RTSP URL only if it is related only to one access camera
     * @param rtspUrl {String} - a RTSP URL for which to remove the frame
     */
    async removeFrameOrIgnore(rtspUrl) {
        const relatedCamerasCount = await AccessCamera.count({
            where : { rtspUrl }
        });

        if (relatedCamerasCount !== 0) return;

        const framesFileNames = await fs.promises.readdir(this.framesDirPath);
        const rtspUrlHash = createHash(rtspUrl);

        for (const frameFileName of framesFileNames) {
            if (frameFileName.includes(rtspUrlHash)) { // remove files with all extensions for the current RTSP URL
                await fs.promises.unlink(path.join(this.framesDirPath, frameFileName));
            }
        }
    }

    getFrameFileName(rtspUrl) {
        return `${createHash(rtspUrl)}.${this.frameExtension}`;
    }


    _checkDisconnectStatus(camera) {
        const timeToCompareWith = camera.lastSuccessStreamAt || camera.createdAt;

        if (new Date() - new Date(timeToCompareWith) > checkStreamInterval * failedCheckStreamRetries) {
            return true;
        }

        return false;
    }

    async _setDisconnectStatus(camera) {
        if (camera.status === AccessCamera.statuses.DISCONNECTED) return;

        await camera.update({ status: AccessCamera.statuses.DISCONNECTED }, { silent: true });
    }
}

export const camerasManager = new CamerasManager({
    collectFramesIntervalTime          : +intervals.collectFrames,
    collectFramesConcurrentProcsNumber : +collectFramesConfig.concurrentProcsNumber,
    collectFramesProcTimeout           : +collectFramesConfig.procTimeout,
    debug                              : initLogger('CamerasManager')
});
