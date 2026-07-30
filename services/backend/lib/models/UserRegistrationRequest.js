import { DataTypes as DT } from 'sequelize';

import sequelize        from '../sequelizeSingleton.js';
import { hashPassword } from '../utils/common.js';
import Base             from './Base.js';
import Workspace        from './Workspace.js';

const TABLE_NAME = 'users_registration_requests';

export default class UserRegistrationRequest extends Base {
    static initRelations() {
        this.associationBelongsToWorkspace = this.belongsTo(Workspace, {
            foreignKey : 'workspaceId',
            as         : 'workspace',
            onDelete   : 'CASCADE'
        });
    }
}

UserRegistrationRequest.init({
    id          : { type: DT.BIGINT, primaryKey: true, autoIncrement: true },
    workspaceId : {
        type       : DT.BIGINT,
        references : {
            model : 'workspaces',
            key   : 'id'
        },
        onDelete : 'CASCADE'
    },
    subjectName  : { type: DT.STRING, allowNull: false },
    email        : { type: DT.STRING, allowNull: false },
    subjectPhone : { type: DT.STRING, allowNull: true },
    passwordHash : { type: DT.STRING, allowNull: false },
    createdAt    : { type: DT.DATE(3), allowNull: false, defaultValue: sequelize.literal('CURRENT_TIMESTAMP(3)') },
    deletedAt    : { type: DT.DATE(3), allowNull: true },
    password     : {
        type : DT.VIRTUAL,
        set(password) {
            const hash = hashPassword(password);

            this.setDataValue('passwordHash', hash);
        }
    }
}, {
    tableName  : TABLE_NAME,
    timestamps : true,
    paranoid   : true,
    createdAt  : false,
    updatedAt  : false,
    indexes    : [
        {
            unique : true,
            fields : [ 'workspaceId', 'userId' ]
        }
    ],
    sequelize
});
