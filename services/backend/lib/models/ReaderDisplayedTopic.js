import { DataTypes as DT } from 'sequelize';

import sequelize         from '../sequelizeSingleton.js';
import Base              from './Base';
import Workspace         from './Workspace';
import AccessTokenReader from './AccessTokenReader';

export default class ReaderDisplayedTopic extends Base {
    static initRelations() {
        this.associationBelongsToWorkspace = this.belongsTo(Workspace, {
            foreignKey : 'workspaceId',
            as         : 'workspace',
            onDelete   : 'CASCADE'
        });
        this.associationBelongsToAccessTokenReader = this.belongsTo(AccessTokenReader, {
            foreignKey : 'accessTokenReaderId',
            as         : 'accessTokenReader',
            onDelete   : 'CASCADE'
        });
    }
}

ReaderDisplayedTopic.init({
    workspaceId : {
        type       : DT.BIGINT,
        primaryKey : true,
        references : {
            model : 'workspaces',
            key   : 'id'
        },
        onDelete : 'CASCADE'
    },
    accessTokenReaderId : {
        type       : DT.BIGINT,
        primaryKey : true,
        references : {
            model : 'accesstokenreaders',
            key   : 'id'
        },
        onDelete : 'CASCADE'
    },
    topic : {
        type       : DT.STRING,
        primaryKey : true,
        allowNull  : false
    }
}, {
    tableName  : 'readers_displayed_topics',
    timestamps : false,
    sequelize
});
