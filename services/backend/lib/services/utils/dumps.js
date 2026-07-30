/* eslint-disable no-sync */
/* eslint-disable no-nested-ternary,max-len */
import path from 'path';
import fs from 'fs-extra';
import {
    staticUrl,
    dns,
    apiURL,
    emqxTcpPort,
    rootSSLCertPath,
    accessCameras as accessCamerasConfig,
    mode,
    s3
} from '../../config';
import AccessTokenReaders from '../../models/AccessTokenReader';
import AdminUser          from '../../models/AdminUser';
import { camerasManager } from '../../managers/camerasManager';
import mobileReaderGroupLogsPaths from '../../../etc/accessReaderMobileGroups/paths';

const CERT_PATH                  = path.resolve(rootSSLCertPath);
const ACCESS_CAMERAS_FRAMES_PATH = path.join(
    staticUrl,
    accessCamerasConfig.staticDirPath,
    accessCamerasConfig.framesDir
);

function getFrameFullPath(rtspUrl) {
    const frameFileName = camerasManager.getFrameFileName(rtspUrl);

    return path.join(ACCESS_CAMERAS_FRAMES_PATH, frameFileName);
}

export function dumpAccessCamera(accessCamera) {
    return {
        id                  : accessCamera.id,
        name                : accessCamera.name,
        enabled             : accessCamera.enabled,
        isArchived          : accessCamera.isArchived,
        wssStreamUrl        : `wss://${dns}/streamming-service/${accessCamera.id}`,
        createdAt           : accessCamera.createdAt,
        lastSuccessStreamAt : accessCamera.lastSuccessStreamAt,
        lastAttemptAt       : accessCamera.lastAttemptAt,
        updatedAt           : accessCamera.updatedAt,
        accessTokenReaders  : accessCamera.accessTokenReaders ?
            accessCamera.accessTokenReaders.map(dumpAccessTokenReader)
            : undefined,
        poster : getFrameFullPath(accessCamera.rtspUrl),
        status : accessCamera.status
    };
}
export function dumpAccessReadersMobileGroup(group) {
    return {
        id                 : group.id,
        name               : group.name,
        logoPath           : mobileReaderGroupLogsPaths[group.logoType] || null,
        logoColor          : group.logoColor,
        createdAt          : group.createdAt,
        updatedAt          : group.updatedAt,
        accessTokenReaders : group.accessTokenReaders ?
            group.accessTokenReaders.map(dumpAccessTokenReader)
            : undefined
    };
}

export function dumpAdminUser(admin) {
    const dump = {
        id        : admin.id,
        login     : admin.login,
        avatar    : admin.avatar ? `${staticUrl}/admin-users/${admin.avatar}` : null,
        createdAt : admin.createdAt,
        updatedAt : admin.updatedAt
    };

    return dump;
}
export function dumpUser(user) {
    const dump = {
        id        : user.id,
        email     : user.email,
        createdAt : user.createdAt,
        updatedAt : user.updatedAt
    };

    return dump;
}

export function dumpAccessSubjectToken(accessToken) {
    return {
        id              : accessToken.id,
        accessSubjectId : accessToken.accessSubjectId,
        name            : accessToken.name,
        code            : accessToken.code,
        type            : accessToken.type,
        enabled         : accessToken.enabled,
        isArchived      : accessToken.isArchived,
        assignedAt      : accessToken.assignedAt,
        createdAt       : accessToken.createdAt,
        updatedAt       : accessToken.updatedAt
    };
}

export function dumpAccessSchedule(accessSchedule) {
    return {
        id         : accessSchedule.id,
        name       : accessSchedule.name,
        enabled    : accessSchedule.enabled,
        isArchived : accessSchedule.isArchived,
        createdAt  : accessSchedule.createdAt,
        updatedAt  : accessSchedule.updatedAt,
        dates      : accessSchedule.accessScheduleDates ?
            accessSchedule.accessScheduleDates.map(dumpAccessScheduleDate) : []
    };
}

export function bitArrayToNumber(array, size) {
    let number = 0;

    array.slice(0, size).reverse().forEach((v, i) => number |= (v << i));

    return number;
}
export function numberToBitArray(number, size) {
    const array = [];

    // eslint-disable-next-line more/no-c-like-loops
    for (let i = 0; i < size; ++i) array.push((number >> i) & 1);

    return array.reverse();
}

export function dumpAccessScheduleDate(scheduleDate) {
    return {
        id          : scheduleDate.id,
        scheduleId  : scheduleDate.scheduleId,
        from        : (scheduleDate.from !== null) ? (scheduleDate.from - 0) : null,
        to          : (scheduleDate.to !== null) ? (scheduleDate.to - 0) : null,
        weekBitMask : (scheduleDate.weekBitMask !== null) ?
            numberToBitArray(scheduleDate.weekBitMask, 7) : null,
        monthBitMask : (scheduleDate.monthBitMask !== null) ?
            numberToBitArray(scheduleDate.monthBitMask, 31) : null,
        dailyIntervalStart : scheduleDate.dailyIntervalStart,
        dailyIntervalEnd   : scheduleDate.dailyIntervalEnd
    };
}

export function dumpAccessSubject(accessSubject) {
    return {
        id                  : accessSubject.id,
        name                : accessSubject.name,
        fullName            : `${accessSubject.name}${(accessSubject.position) ? (` (${accessSubject.position})`) : ''}`,
        position            : accessSubject.position,
        email               : accessSubject.email,
        phone               : accessSubject.phone,
        phoneEnabled        : accessSubject.phoneEnabled,
        avatar              : accessSubject.avatar ? `${staticUrl}/access-subjects/${accessSubject.avatar}` : null,
        avatarColor         : accessSubject.avatarColor,
        enabled             : accessSubject.enabled,
        isArchived          : accessSubject.isArchived,
        isInvited           : accessSubject.isInvited,
        mobileEnabled       : accessSubject.mobileEnabled,
        showReaderGroups    : accessSubject.showReaderGroups,
        accessSubjectTokens : accessSubject.accessSubjectTokens
            ? accessSubject.accessSubjectTokens.map(dumpAccessSubjectToken)
            : null,
        createdAt       : accessSubject.createdAt,
        updatedAt       : accessSubject.updatedAt,
        userId          : accessSubject.userId,
        registered      : !!accessSubject.userId,
        canAttachTokens : accessSubject.canAttachTokens,
        virtualCode     : mode === 'test' ? accessSubject.virtualCode : undefined
    };
}

export async function dumpMobileAccessSubject(accessSubject) {
    const adminUser = await AdminUser.findOne({ where: { workspaceId: accessSubject.workspaceId } });

    return {
        id              : accessSubject.id,
        name            : accessSubject.name,
        fullName        : `${accessSubject.name}${(accessSubject.position) ? (` (${accessSubject.position})`) : ''}`,
        position        : accessSubject.position,
        email           : accessSubject.email,
        phone           : accessSubject.phone,
        avatar          : accessSubject.avatar ? `${staticUrl}/access-subjects/${accessSubject.avatar}` : null,
        workspaceAvatar : dumpAdminUser(adminUser).avatar,
        avatarColor     : accessSubject.avatarColor,
        createdAt       : accessSubject.createdAt,
        updatedAt       : accessSubject.updatedAt,
        canAttachTokens : accessSubject.canAttachTokens
    };
}

export function dumpAccessReadersGroup(accessReadersGroup) {
    return {
        id                 : accessReadersGroup.id,
        name               : accessReadersGroup.name,
        enabled            : accessReadersGroup.enabled,
        isArchived         : accessReadersGroup.isArchived,
        color              : accessReadersGroup.color,
        accessTokenReaders : accessReadersGroup.accessTokenReaders ?
            accessReadersGroup.accessTokenReaders.map(dumpAccessTokenReader)
            : undefined,
        createdAt : accessReadersGroup.createdAt,
        updatedAt : accessReadersGroup.updatedAt
    };
}

export function dumpReaderDisplayedTopic(displayedTopic) {
    return displayedTopic.topic;
}

export function dumpAccessTokenReader(accessTokenReader) {
    // const stateStatus = (accessTokenReader.enabled && !accessTokenReader.isArchived && accessTokenReader.activeAt) ?
    // eslint-disable-next-line max-len
    //    ((new Date() - accessTokenReader.activeAt < tokenReaderActivePeriodSeconds * 1000) ? 'ACTIVE' : 'DISCONNECTED') : 'INACTIVE';
    const { userAccessTokenReader, accessCameras } = accessTokenReader;
    const customName = userAccessTokenReader && userAccessTokenReader.length ?
        userAccessTokenReader[0].customName :
        '';
    const accessCamera = accessCameras && accessCameras.length ? accessCameras[0] : null;

    return {
        id                  : accessTokenReader.id,
        code                : accessTokenReader.code,
        name                : customName || accessTokenReader.name,
        phone               : accessTokenReader.phone,
        stateStatus         : accessTokenReader.stateStatus,
        connectionStatus    : dumpAccessReaderConnectionStatus(accessTokenReader),
        enabled             : accessTokenReader.enabled,
        isArchived          : accessTokenReader.isArchived,
        activeAt            : accessTokenReader.activeAt,
        createdAt           : accessTokenReader.createdAt,
        updatedAt           : accessTokenReader.updatedAt,
        accessReadersGroups : accessTokenReader.accessReadersGroups ?
            accessTokenReader.accessReadersGroups.map(dumpAccessReadersGroup)
            : undefined,
        hasUpdates   : accessTokenReader.syncChanges && accessTokenReader.syncChanges.length > 0,
        accessCamera : accessCamera ?
            {
                rtspUrl : accessCamera.rtspUrl,
                poster  : getFrameFullPath(accessCamera.rtspUrl),
                status  : accessCamera.status
            } :
            undefined,
        displayedTopics : accessTokenReader.displayedTopics ?
            accessTokenReader.displayedTopics.map(dumpReaderDisplayedTopic) :
            undefined
    };
}

function dumpAccessReaderConnectionStatus(reader) {
    const connectionStatus = AccessTokenReaders.connectionStatusesMap.find(({ stateStatus, brokerStateStatus }) => {
        return stateStatus === reader.stateStatus && brokerStateStatus === reader.brokerStateStatus;
    });

    if (!connectionStatus) throw new Error('connection status have not been recognized');

    return { color: connectionStatus.color, title: connectionStatus.title };
}

export function dumpAccessSetting(accessSetting) {
    return {
        id                  : accessSetting.id,
        enabled             : accessSetting.enabled,
        isArchived          : accessSetting.isArchived,
        accessSubjects      : accessSetting.accessSubjects.map(dumpAccessSubject),
        accessSchedules     : accessSetting.accessSchedules.map(dumpAccessSchedule),
        accessTokenReaders  : accessSetting.accessTokenReaders.map(dumpAccessTokenReader),
        accessReadersGroups : accessSetting.accessReadersGroups.map(dumpAccessReadersGroup),
        createdAt           : accessSetting.createdAt,
        updatedAt           : accessSetting.updatedAt
    };
}

export function dumpAccessLog(log) {
    return {
        id                   : log.id,
        accessTokenReaderId  : log.accessTokenReaderId,
        accessSubjectTokenId : log.accessSubjectTokenId,
        accessSubjectId      : log.accessSubjectId,
        status               : log.status,
        initiatorType        : log.initiatorType,
        attemptedAt          : log.attemptedAt,
        createdAt            : log.createdAt,
        accessTokenReader    : log.accessTokenReader
            ? dumpAccessTokenReader(log.accessTokenReader)
            : null,
        accessSubjectToken : log.accessSubjectToken
            ? dumpAccessSubjectToken(log.accessSubjectToken)
            : null,
        accessSubject : log.accessSubject
            ? dumpAccessSubject(log.accessSubject)
            : null,
        recordedMedia : {
            frames : log.recordedFrames.map(dumpLogRecordedFrame),
            videos : log.recordedVideos.map(dumpLogRecordedVideo)
        }
    };
}

export function dumpAccessAPISetting(workspace, { requestSubjectRegistration = {} } = {}) {
    return {
        url                        : apiURL,
        token                      : workspace.accessToken,
        cert                       : fs.existsSync(CERT_PATH) && fs.readFileSync(CERT_PATH, 'utf8') || null,
        requestSubjectRegistration : {
            deepLinkUrl : requestSubjectRegistration.deepLinkUrl,
            qrCode      : requestSubjectRegistration.qrCode
        },
        emqxTcpPort
    };
}

export function dumpWorkspaceSettings(workspace) {
    return {
        timezone          : workspace.timezone,
        notificationTypes : workspace.notificationTypes,
        allowCollectMedia : workspace.allowCollectMedia
    };
}

export function dumpNotification(notification) {
    return {
        id                 : notification.id,
        type               : notification.type,
        data               : notification.data,
        message            : notification.message,
        isRead             : notification.isRead,
        createdAt          : notification.createdAt,
        updatedAt          : notification.updatedAt,
        accessSubject      : notification.accessSubject ? dumpAccessSubject(notification.accessSubject) : null,
        accessSubjectToken : notification.accessSubjectToken ? dumpAccessSubjectToken(notification.accessSubjectToken) : null,
        accessTokenReader  : notification.accessTokenReader ? dumpAccessTokenReader(notification.accessTokenReader) : null
    };
}

export function dumpUserAccessTokenReader(userAccessTokenReader) {
    return {
        accessTokenReaderId : +userAccessTokenReader.accessTokenReaderId,
        customName          : userAccessTokenReader.customName
    };
}

export function dumpReportedIssue(issue) {
    return {
        id        : issue.id,
        type      : issue.type,
        message   : issue.message,
        status    : issue.status,
        adminId   : issue.adminId,
        userId    : issue.userId,
        createdAt : issue.createdAt,
        updatedAt : issue.updatedAt
    };
}

export function dumpLogRecordedFrame(recordedFrame) {
    return {
        path            : `${s3.bucket}/${recordedFrame.objectKey}`,
        originCreatedAt : recordedFrame.originCreatedAt
    };
}

export function dumpLogRecordedVideo(recordedVideo) {
    return {
        path            : `${s3.bucket}/${recordedVideo.objectKey}`,
        originCreatedAt : recordedVideo.originCreatedAt
    };
}
