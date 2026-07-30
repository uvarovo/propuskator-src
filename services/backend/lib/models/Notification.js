// import handlebars from 'handlebars';
import { DataTypes as DT, Op } from 'sequelize';
import sequelize from '../sequelizeSingleton';
import { configurableTypes as notificationTypes, alwaysEnabledTypes } from '../constants/notificationTypes';
import Base from './WorkspaceModelBase';
import AccessSubject from './AccessSubject';
import Workspace from './Workspace';
import AccessSubjectToken from './AccessSubjectToken';
import AccessTokenReader from './AccessTokenReader';

class Notification extends Base {
    static types = notificationTypes;
    static alwaysEnabledTypes = alwaysEnabledTypes;

    static initRelations() {
        super.initRelations();
        this.AssociationAccessSubject = this.belongsTo(AccessSubject, { as: 'accessSubject', foreignKey: 'accessSubjectId' });
        this.AssociationAccessSubjectToken = this.belongsTo(AccessSubjectToken, { as: 'accessSubjectToken', foreignKey: 'accessSubjectTokenId' });
        this.AssociationAccessTokenReader = this.belongsTo(AccessTokenReader, { as: 'accessTokenReader', foreignKey: 'accessTokenReaderId' });
    }

    static async create(notification, options) {
        const workspaceId = Notification.getWorkspaceIdFromNamespace() || notification.workspaceId;
        const allowedTypeGroups = await Workspace.getAllowedNotificationTypes(workspaceId);
        const typeGroup = Object.keys(this.types).find(k => this.types[k][notification.type]);

        if (allowedTypeGroups.includes(typeGroup) || this.alwaysEnabledTypes[notification.type]) {
            return super.create(notification, options);
        }
    }

    static async countMeta() {
        const { count, rows } = await Notification.findAndCountAll({
            raw        : true,
            attributes : [
                [ sequelize.fn('SUM', sequelize.col('isRead')), 'readTotal' ]
            ]
        });

        // should be always only 1 row from findAll
        let readTotal = rows[0] ? +rows[0].readTotal : 0;

        // maximum protection
        if (isNaN(readTotal)) readTotal = 0;

        return { count, unreadTotal: count - readTotal };
    }

    static async findAllByParams({ ids, limit, offset, ...filters }, options = {}) {
        const filterScopes = [
            { method: [ 'ids', ids ] },
            { method: [ 'types', filters.types ] },
            { method: [ 'isRead', filters.isRead ] },
            // { method: [ 'lastWeek' ] }, // unknown filter
            { method : [ 'updateDates', {
                updateStart : filters.updateStart,
                updateEnd   : filters.updateEnd
            } ] },
            { method : [ 'createDates', {
                createStart : filters.createStart,
                createEnd   : filters.createEnd
            } ] }
        ];
        const orderArr = [ [ 'isRead', 'ASC' ], [ 'id', 'DESC' ] ];

        const { rows: notifications, count } = await Notification.scope(filterScopes).findAndCountAll({
            order   : orderArr,
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
                }
            ],
            subQuery : false,
            distinct : true
        }, options);

        return { notifications, count };
    }
}
Notification.init({
    id                   : { type: DT.BIGINT, primaryKey: true, autoIncrement: true },
    // eslint-disable-next-line max-len
    workspaceId          : { type: DT.BIGINT, allowNull: false, defaultValue: () => Notification.getWorkspaceIdFromNamespace() },
    accessSubjectTokenId : { type: DT.BIGINT, allowNull: true },
    accessSubjectId      : { type: DT.BIGINT, allowNull: true },
    accessTokenReaderId  : { type: DT.BIGINT, allowNull: true },
    data                 : { type: DT.JSON, allowNull: true },
    type                 : { type: DT.STRING, allowNull: false },
    message              : { type: DT.STRING, allowNull: false },
    isRead               : { type: DT.BOOLEAN, allowNull: false, defaultValue: false },
    createdAt            : { type: DT.DATE(3) },
    updatedAt            : { type: DT.DATE(3) }
}, {
    timestamps : false,
    scopes     : {
        workspace(workspaceId) {
            return { where: { workspaceId } };
        },
        ids(ids) {
            if (ids) {
                return {
                    where : {
                        [Op.and] : [
                            ...(this._scope && this._scope.where && this._scope.where[Op.and] || []),
                            {
                                id : ids
                            }
                        ]
                    }
                };
            }

            return {};
        },
        types(types) {
            if (types) {
                return {
                    where : {
                        [Op.and] : [
                            ...(this._scope && this._scope.where && this._scope.where[Op.and] || []),
                            {
                                type : types
                            }
                        ]
                    }
                };
            }

            return {};
        },
        isRead(isRead) {
            if (typeof isRead === 'boolean') {
                return {
                    where : {
                        [Op.and] : [
                            ...(this._scope && this._scope.where && this._scope.where[Op.and] || []),
                            {
                                isRead
                            }
                        ]
                    }
                };
            }

            return {};
        },
        lastWeek() {
            return {
                where : {
                    [Op.and] : [
                        ...(this._scope && this._scope.where && this._scope.where[Op.and] || []),
                        {
                            createdAt : {
                                [Op.gte] : new Date().setDate(new Date().getDate() - 7)
                            }
                        }
                    ]
                }
            };
        },
        updateDates({ updateStart, updateEnd }) {
            if (updateStart || updateEnd) {
                return {
                    where : {
                        [Op.and] : [
                            ...(this._scope && this._scope.where && this._scope.where[Op.and] || []),
                            {
                                updatedAt : {
                                    ...(updateStart ? { [Op.gte]: updateStart } : {}),
                                    ...(updateEnd ? { [Op.lte]: updateEnd } : {})
                                }
                            }
                        ]
                    }
                };
            }

            return {};
        },
        createDates({ createStart, createEnd }) {
            if (createStart || createEnd) {
                return {
                    where : {
                        [Op.and] : [
                            ...(this._scope && this._scope.where && this._scope.where[Op.and] || []),
                            {
                                createdAt : {
                                    ...(createStart ? { [Op.gte]: createStart } : {}),
                                    ...(createEnd ? { [Op.lte]: createEnd } : {})
                                }
                            }
                        ]
                    }
                };
            }

            return {};
        }
    },
    sequelize
});

export default Notification;
