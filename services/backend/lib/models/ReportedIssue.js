/* eslint-disable more/no-duplicated-chains, camelcase */
import { DataTypes as DT } from 'sequelize';
import {
    STATUSES,
    TYPES,
    ADMIN_ISSUE_TYPES,
    USER_ISSUE_TYPES
}                       from '../constants/reportedIssues';
import sequelize        from '../sequelizeSingleton';
import referenceManager from './referenceManager';
import Base             from './Base';

referenceManager.set('reported_issues_types', Object.values(TYPES));
referenceManager.set('reported_issues_statuses', Object.values(STATUSES));
referenceManager.set('reported_admin_issues_types', Object.values(ADMIN_ISSUE_TYPES));
referenceManager.set('reported_user_issues_types', Object.values(USER_ISSUE_TYPES));

class ReportedIssue extends Base {
    static initRelations() {
        const UserModel      = sequelize.model('User');
        const AdminUserModel = sequelize.model('AdminUser');

        this.belongsTo(UserModel, {
            foreignKey : 'userId',
            as         : 'user'
        });
        this.belongsTo(AdminUserModel, {
            foreignKey : 'adminId',
            as         : 'admin'
        });
    }

    static async createIssue(data) {
        return this.create({
            ...data,
            status : STATUSES.PENDING
        });
    }

    async pending() {
        this.status = STATUSES.PENDING;

        return this.save();
    }

    async sending() {
        this.status = STATUSES.SENDING;

        return this.save();
    }

    async sent() {
        this.status = STATUSES.SENT;

        return this.save();
    }
}

ReportedIssue.init({
    id        : { type: DT.BIGINT.UNSIGNED, primaryKey: true },
    type      : { type: DT.STRING, allowNull: false },
    status    : { type: DT.STRING, allowNull: false },
    message   : { type: DT.TEXT, allowNull: false },
    userId    : { type: DT.BIGINT.UNSIGNED, allowNull: true },
    adminId   : { type: DT.BIGINT.UNSIGNED, allowNull: true },
    createdAt : { type: DT.DATE(3) },
    updatedAt : { type: DT.DATE(3) }
}, {
    tableName : 'reported_issues',
    sequelize
});

export default ReportedIssue;
