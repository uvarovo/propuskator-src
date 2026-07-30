import {
    DataTypes as DT,
    Op
} from 'sequelize';
import sequelize from '../sequelizeSingleton';
import Base from './WorkspaceModelBase';
import AccessTokenReader from './AccessTokenReader';
import AccessSubject from './AccessSubject';
import AccessSubjectToken from './AccessSubjectToken';
import LogRecordedFrame from './LogRecordedFrame.js';
import LogRecordedVideo from './LogRecordedVideo.js';

export const INITIATOR_TYPES = {
    PHONE        : 'PHONE',
    SUBJECT      : 'SUBJECT',
    ACCESS_POINT : 'ACCESS_POINT',
    BUTTON       : 'BUTTON', // this initiator type is sent when a reader is opened using its exit button
    ALARM        : 'ALARM' // this initiator type is sent when a reader is activated/deactivated alarm mode
};

class AccessLog extends Base {
    static STATUS_SUCCESS   = 'SUCCESS';
    static STATUS_DENIED    = 'DENIED';
    static STATUS_ALARM_ON  = 'ALARM_ON';
    static STATUS_ALARM_OFF = 'ALARM_OFF';

    static initRelations() {
        this.AssociationAccessTokenReader = this.belongsTo(AccessTokenReader, { as: 'accessTokenReader', foreignKey: 'accessTokenReaderId' });
        this.AssociationAccessSubject = this.belongsTo(AccessSubject, { as: 'accessSubject', foreignKey: 'accessSubjectId' });
        this.AssociationAccessSubjectToken = this.belongsTo(AccessSubjectToken, { as: 'accessSubjectToken', foreignKey: 'accessSubjectTokenId' });
        this.AssociationLogRecordedFrame = this.hasMany(LogRecordedFrame, {
            as         : 'recordedFrames',
            foreignKey : 'logId'
        });
        this.AssociationLogRecordedVideo = this.hasMany(LogRecordedVideo, {
            as         : 'recordedVideos',
            foreignKey : 'logId'
        });
    }

    static async findAllByParams({ ids, limit, offset, sortedBy, order, ...filters }, options = {}) {
        const filterScopes = [
            { method: [ 'ids', ids ] },
            { method: [ 'sorting', { sortedBy, order } ] },
            { method: [ 'search', filters.search ] },
            { method: [ 'status', filters.status ] },
            { method: [ 'accessSubjectTokenIds', filters.accessSubjectTokenIds ] },
            { method: [ 'accessTokenReaderIds', filters.accessTokenReaderIds ] },
            { method: [ 'accessSubjectIds', filters.accessSubjectIds ] },
            { method : [ 'createDates', {
                createStart : filters.createStart,
                createEnd   : filters.createEnd
            } ] },
            { method: [ 'initiatorTypes', filters.initiatorTypes ] }
        ];

        let orderToReq = null;

        if (sortedBy === 'subjectName') {
            orderToReq = [ AccessLog.AssociationAccessSubject, 'name' ];
        } else if (sortedBy === 'tokenName') {
            orderToReq = [ AccessLog.AssociationAccessSubjectToken, 'name' ];
        } else if (sortedBy === 'tokenCode') {
            orderToReq = [ AccessLog.AssociationAccessSubjectToken, 'code' ];
        } else if (sortedBy === 'readerName') {
            orderToReq = [ AccessLog.AssociationAccessTokenReader, 'name' ];
        } else {
            orderToReq = [ sortedBy ];
        }

        orderToReq.push(order);
        const { rows: accessLogs, count } = await AccessLog.scope(filterScopes).findAndCountAll({
            ...options,
            ...(ids) ? {} : { limit, offset },
            include : [
                {
                    association : this.AssociationAccessTokenReader,
                    required    : false,
                    paranoid    : false
                },
                {
                    association : this.AssociationAccessSubject,
                    required    : false,
                    paranoid    : false
                },
                {
                    association : this.AssociationAccessSubjectToken,
                    required    : false,
                    paranoid    : false
                },
                {
                    association : this.AssociationLogRecordedFrame,
                    required    : false
                },
                {
                    association : this.AssociationLogRecordedVideo,
                    required    : false
                }
            ],
            order    : [ orderToReq, [ 'id', 'ASC' ] ],
            // Do not set subQuery property to false, it causes such bugs as described
            // here: https://stackoverflow.com/questions/15897055/proper-pagination-in-a-join-select.
            // Also, it should be notice that "subQuery" option is not documented in the official docs:
            // https://github.com/sequelize/sequelize/issues/7865
            // subQuery : false,
            distinct : true
        });

        // Sort the recorded media by the creation date of its origin files in ascending order
        accessLogs.forEach(log => {
            log.recordedFrames.sort(
                (firstFrame, secondFrame) => firstFrame.originCreatedAt - secondFrame.originCreatedAt
            );
            log.recordedVideos.sort(
                (firstVideo, secondVideo) => firstVideo.originCreatedAt - secondVideo.originCreatedAt
            );
        });

        return { accessLogs, count };
    }
}

AccessLog.init({
    id                   : { type: DT.BIGINT, primaryKey: true, autoIncrement: true },
    // eslint-disable-next-line max-len
    workspaceId          : { type: DT.BIGINT, allowNull: false, defaultValue: () => AccessLog.getWorkspaceIdFromNamespace() },
    accessTokenReaderId  : { type: DT.BIGINT, allowNull: false },
    accessSubjectTokenId : { type: DT.BIGINT, allowNull: true },
    accessSubjectId      : { type: DT.BIGINT, allowNull: true },
    status               : {
        type : DT.ENUM(
            AccessLog.STATUS_SUCCESS,
            AccessLog.STATUS_DENIED,
            AccessLog.STATUS_ALARM_ON,
            AccessLog.STATUS_ALARM_OFF
        ),
        allowNull : false
    },
    initiatorType : { type: DT.ENUM(Object.values(INITIATOR_TYPES)), allowNull: false },
    attemptedAt   : { type: DT.DATE(3) },
    createdAt     : { type: DT.DATE(3) }
}, {
    timestamps : false,
    scopes     : {
        ids(ids) {
            if (ids) {
                return {
                    where : { id: ids }
                };
            }

            return {};
        },
        sorting({ sortedBy, order }) {
            let sorting;

            switch (sortedBy) {
                case 'status':
                    sorting = [ [ sortedBy, order ] ];
                    break;

                case 'readerName':
                    sorting = [ [ 'accessTokenReader', 'name', order ] ];
                    break;

                case 'subjectName':
                    sorting = [ [ 'accessSubject', 'name', order ] ];
                    break;

                case 'tokenName':
                    sorting = [ [ 'accessSubjectToken', 'name', order ] ];
                    break;

                case 'tokenCode':
                    sorting = [ [ 'accessSubjectToken', 'code', order ] ];
                    break;

                case 'initiatorType':
                    sorting = [ [ 'initiatorType', order ] ];
                    break;

                default:
                    sorting = [ [ 'createdAt', order ] ];
                    break;
            }


            return { order: sorting };
        },
        search(search) {
            if (search) {
                return {
                    where : {
                        [Op.and] : [
                            ...(this._scope && this._scope.where && this._scope.where[Op.and] || []),
                            {
                                [Op.or] : [
                                    {
                                        '$accessSubject.name$' : {
                                            [Op.like] : `%${search}%`
                                        }
                                    },
                                    {
                                        '$accessSubjectToken.name$' : {
                                            [Op.like] : `%${search}%`
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                };
            }

            return {};
        },
        createDates({ createStart, createEnd }) {
            return {
                where : (createStart || createEnd) ? {
                    createdAt : {
                        ...(createStart ? { [Op.gte]: createStart } : null),
                        ...(createEnd ? { [Op.lte]: createEnd } : null)
                    }
                } : {}
            };
        },
        status(status) {
            if (status) {
                return {
                    where : { status }
                };
            }

            return {};
        },
        accessSubjectTokenIds(accessSubjectTokenIds) {
            if (accessSubjectTokenIds) {
                return {
                    where : { accessSubjectTokenId: accessSubjectTokenIds }
                };
            }

            return {};
        },
        accessTokenReaderIds(accessTokenReaderIds) {
            if (accessTokenReaderIds) {
                return {
                    where : { accessTokenReaderId: accessTokenReaderIds }
                };
            }

            return {};
        },
        accessSubjectIds(accessSubjectIds) {
            if (accessSubjectIds) {
                return {
                    where : { accessSubjectId: accessSubjectIds }
                };
            }

            return {};
        },
        initiatorTypes(types) {
            return types?.length ? { where: { initiatorType: types } } : {};
        }
    },
    sequelize
});

export default AccessLog;
