/* eslint-disable no-param-reassign */
import path from 'path';

import { DataTypes as DT, Op }    from 'sequelize';
import sequelize                  from '../sequelizeSingleton';
import { camerasManager }         from '../managers/camerasManager';
import { initLogger }             from '../extensions/Logger';
import { hideSensitiveData }      from '../utils/hideSensitiveData';
import utils                      from '../models/utils';
import config                     from '../config.js';
import { MILLISECONDS_IN_SECOND } from '../constants/common.js';
import { readFilesStatsFromDir }  from '../utils/common.js';
import Base                       from './WorkspaceModelBase';
import AccessTokenReader          from './AccessTokenReader';
import CameraToReaderMap          from './mappings/CameraToReaderMap';
import cameraStatuses             from './../constants/camerasStatuses';
import referenceManager           from './referenceManager';

const logger                                     = initLogger('AccessCamera');
const MEDIA_DIR_PATH                             = config.mediaDirPath;
const LOGS_RECORDED_FRAMES_TO_SAVE_NUMBER        = +config.logs.recordedFramesToSaveNumber;
const LOGS_RECORDED_VIDEOS_TO_SAVE_NUMBER        = +config.logs.recordedVideosToSaveNumber;
const CAMERAS_MEDIA_COLLECT_FRAMES_INTERVAL_TIME =
    +config.camerasMedia.collectFramesIntervalTime * MILLISECONDS_IN_SECOND;
const CAMERAS_MEDIA_VIDEO_SEGMENT_TIME =
    +config.camerasMedia.videoSegmentTime * MILLISECONDS_IN_SECOND;

async function removeFrameOrIgnore(rtspUrl, id) {
    try {
        await camerasManager.removeFrameOrIgnore(rtspUrl);

        logger.info(`Successfully removed frame for camera with id: "${id}"`);
    } catch (err) {
        logger.warn(`Error with removing frame for camera with id: "${id}"`);
    }
}

referenceManager.set('access_cameras_statuses', Object.values(cameraStatuses));

class AccessCamera extends Base {
    static statuses = cameraStatuses;

    static initRelations() {
        super.initRelations();
        this.AssociationAccessTokenReaders = this.belongsToMany(AccessTokenReader, { through: CameraToReaderMap, as: 'accessTokenReaders', foreignKey: 'accessCameraId', otherKey: 'accessTokenReaderId' });
        this.AssociationCameraToReaderMap = this.hasMany(CameraToReaderMap, { as: 'cameraToReaderMap', foreignKey: 'accessCameraId' });
    }

    static async findAllByParams({ ids, limit, offset, sortedBy, order, ...filters }, options = {}) {
        const filterScopes = [
            { method: [ 'ids', ids ] },
            { method: [ 'enabled', filters.enabled ] },
            { method: [ 'status', filters.status ] },
            { method: [ 'isArchived', filters.isArchived ] },
            { method: [ 'search', filters.search ] },
            { method : [ 'updateDates', {
                updateStart : filters.updateStart,
                updateEnd   : filters.updateEnd
            } ] },
            { method : [ 'createDates', {
                createStart : filters.createStart,
                createEnd   : filters.createEnd
            } ] }
        ];
        // do not set subQuery property to false, it causes such bugs as described here: https://stackoverflow.com/questions/15897055/proper-pagination-in-a-join-select
        const { rows: accessCameras, count } = await AccessCamera.scope(filterScopes).findAndCountAll({
            ...options,
            ...(ids) ? {} : { limit, offset },
            order    : [ [ sortedBy, order ], [ 'id', 'ASC' ] ],
            include  : [ { association: AccessCamera.AssociationAccessTokenReaders, required: false } ],
            subQuery : true
        });

        return { accessCameras, count };
    }

    getRtspUrlHash() {
        return utils.createHash(this.rtspUrl);
    }

    getFramesDirPath() {
        return path.join(MEDIA_DIR_PATH, 'cameras', this.getRtspUrlHash(), 'frames');
    }

    getVideosDirPath() {
        return path.join(MEDIA_DIR_PATH, 'cameras', this.getRtspUrlHash(), 'videos');
    }

    // TODO: add unit tests for this method
    // Returns files' paths that are referred to the frames that are created nearest to the provided time.
    //     time {number} - time for which to find nearest frames, UNIX timestamp
    //     options {Object}: - an options object
    //         - framesNumber - number of nearest frames to find
    // Returns: Array<string> - an array of paths to frames
    async getFramesNearestToTime(time, { framesNumber = LOGS_RECORDED_FRAMES_TO_SAVE_NUMBER } = {}) {
        const framesDirPath = this.getFramesDirPath();
        const files = await readFilesStatsFromDir(framesDirPath);

        // Video files are named with UNIX timestamp of its creation time as base name, because
        // probably(tested on MacOS) there is no way to check file's creation time that was mounted with Docker volume
        // Example: '1634997883000.mp4'
        files.forEach(file => {
            const fileCreationTime = +path.parse(file.path).name;

            // The time which was in the RTSP stream when started recording frame:
            // ffmpeg utility records 1/60 part of frame per second and after one minute
            // it writes frame to a file with current system timestamp in name(not the actual time when
            // started recording this frame)
            // Also, use Reflect.set instead of property accessor syntax because eslint crashes with error for some
            // reasons
            Reflect.set(file, 'startedRecordingAt', fileCreationTime - CAMERAS_MEDIA_COLLECT_FRAMES_INTERVAL_TIME);
        });

        files.sort((firstFile, secondFile) => firstFile.startedRecordingAt - secondFile.startedRecordingAt);

        let nearestFrameIndex = -1;

        let minDiff = Infinity;

        // Use linear search to find nearest frame's index
        files.forEach((file, currIndex) => {
            const currDiff = Math.abs(file.startedRecordingAt - time);

            if (currDiff < minDiff) {
                minDiff = currDiff;
                nearestFrameIndex = currIndex;
            }
        });

        // Case when there is no nearest frame or it is too old, probably because collecting media for this
        // RTSP URL was disabled for a while
        if (nearestFrameIndex === -1 || (minDiff > CAMERAS_MEDIA_COLLECT_FRAMES_INTERVAL_TIME)) return [];

        const framesNumberToIncludeWithNearest = framesNumber - 1;
        const olderFramesOffset = Math.floor(framesNumberToIncludeWithNearest / 2);
        const newerFramesOffset = Math.ceil(framesNumberToIncludeWithNearest / 2);
        const startIndex = (nearestFrameIndex - olderFramesOffset) < 0 ? 0 : nearestFrameIndex - olderFramesOffset;
        const endIndex = (nearestFrameIndex + newerFramesOffset) + 1;

        return files.slice(startIndex, endIndex).map(file => file.path);
    }

    // TODO: add unit tests for this method
    // Returns files' paths that are referred to the videos that are created nearest to the provided time.
    //     time {number} - time for which to find nearest videos, UNIX timestamp
    //     options {Object}: - an options object
    //         - videosNumber - number of nearest videos to find
    // Returns: Array<string> - an array of paths to videos
    async getVideosNearestToTime(time, { videosNumber = LOGS_RECORDED_VIDEOS_TO_SAVE_NUMBER } = {}) {
        const framesDirPath = this.getVideosDirPath();
        const files = await readFilesStatsFromDir(framesDirPath);

        // Video files are named with UNIX timestamp of its creation time as base name, because
        // probably(tested on MacOS) there is no way to check file's creation time that was mounted with Docker volume
        // Example: '1634997883000.mp4'
        files.forEach(file => {
            file.creationTime = +path.parse(file.path).name;
        });

        files.sort((firstFile, secondFile) => firstFile.creationTime - secondFile.creationTime);

        let nearestVideoIndex = -1;

        let minDiff = Infinity;

        // Use linear search to find nearest video's index
        files.forEach((file, currIndex) => {
            const currDiff = Math.abs(file.creationTime - time);

            if (currDiff < minDiff) {
                minDiff = currDiff;
                nearestVideoIndex = currIndex;
            }
        });

        // Case when there is no nearest video or it is too old, probably because collecting media for this
        // RTSP URL was disabled for a while
        if (nearestVideoIndex === -1 || (minDiff > CAMERAS_MEDIA_VIDEO_SEGMENT_TIME)) return [];

        const framesNumberToIncludeWithNearest = videosNumber - 1;
        const olderFramesOffset = Math.ceil(framesNumberToIncludeWithNearest / 2);
        const newerFramesOffset = Math.floor(framesNumberToIncludeWithNearest / 2);
        const startIndex = (nearestVideoIndex - olderFramesOffset) < 0 ? 0 : nearestVideoIndex - olderFramesOffset;
        const endIndex = (nearestVideoIndex + newerFramesOffset) + 1;

        return files.slice(startIndex, endIndex).map(file => file.path);
    }
}

AccessCamera.init({
    id                  : { type: DT.BIGINT, primaryKey: true, autoIncrement: true },
    // eslint-disable-next-line max-len
    workspaceId         : { type: DT.BIGINT, allowNull: false, defaultValue: () => AccessCamera.getWorkspaceIdFromNamespace() },
    name                : { type: DT.STRING, allowNull: false },
    enabled             : { type: DT.BOOLEAN, allowNull: false, defaultValue: true },
    status              : { type: DT.STRING, allowNull: false, defaultValue: AccessCamera.statuses.INIT },
    isArchived          : { type: DT.BOOLEAN, allowNull: false, defaultValue: false },
    rtspUrl             : { type: DT.STRING(2082), allowNull: false },
    lastSuccessStreamAt : { type: DT.DATE(3), allowNull: true },
    lastAttemptAt       : { type: DT.DATE(3), allowNull: true },
    createdAt           : { type: DT.DATE(3) },
    updatedAt           : { type: DT.DATE(3) },
    deletedAt           : { type: DT.DELETED_AT_DATE(3), allowNull: false, defaultValue: { [sequelize.Op.eq]: sequelize.literal('0') } }
}, {
    paranoid   : true,
    timestamps : true,
    deletedAt  : 'deletedAt',
    hooks      : {
        beforeUpdate : async (accessCamera) => {
            if (accessCamera.changed('enabled') && accessCamera.isArchived) throw new Error('Cannot enable archived entity');
            if (accessCamera.changed('isArchived') && accessCamera.isArchived) accessCamera.enabled = false;
        },
        beforeCreate : async (accessCamera) => {
            if (accessCamera.enabled && accessCamera.isArchived) throw new Error('Cannot enable archived entity');
        },
        afterSave : async (accessCamera) => {
            if (accessCamera.changed('rtspUrl')) {
                const { rtspUrl, id } = accessCamera;
                const previousRtspUrl = accessCamera._previousDataValues.rtspUrl;

                await removeFrameOrIgnore(previousRtspUrl, id);

                try {
                    const output = await camerasManager.collectFrame(rtspUrl, id);
                    const hideOutput = hideSensitiveData(output);

                    logger.info(`Successfully collected frame for camera with id: "${id}"`, { output: hideOutput });
                } catch (err) {
                    logger.warn(`Error with collecting frame for camera with id: "${id}", error: ${hideSensitiveData(err.message)}`);
                }
            }
        },
        afterDestroy : async (accessCamera, options) => {
            const { rtspUrl, id } = accessCamera;

            await removeFrameOrIgnore(rtspUrl, id);
            await CameraToReaderMap.destroy({
                where       : { accessCameraId: accessCamera.id },
                transaction : options.transaction
            });
        }
    },
    scopes : {
        ids(ids) {
            if (ids) {
                return {
                    where : { id: ids }
                };
            }

            return {};
        },
        search(search) {
            if (search) {
                return {
                    where : {
                        name : {
                            [Op.like] : `%${search}%`
                        }
                    }
                };
            }

            return {};
        },
        updateDates({ updateStart, updateEnd }) {
            if (updateStart && updateEnd) {
                return {
                    where : {
                        updatedAt : {
                            [Op.gte] : updateStart,
                            [Op.lte] : updateEnd
                        }
                    }
                };
            }

            return {};
        },
        createDates({ createStart, createEnd }) {
            if (createStart && createEnd) {
                return {
                    where : {
                        createdAt : {
                            [Op.gte] : createStart,
                            [Op.lte] : createEnd
                        }
                    }
                };
            }

            return {};
        },
        enabled(enabled) {
            if (typeof enabled === 'boolean') {
                return {
                    where : { enabled }
                };
            }

            return {};
        },
        status(status) {
            if (status) {
                return {
                    where : { status }
                };
            }

            return {};
        },
        isArchived(isArchived) {
            if (typeof isArchived === 'boolean') {
                return {
                    where : { isArchived }
                };
            }

            return {};
        }
    },
    sequelize
});

export default AccessCamera;
