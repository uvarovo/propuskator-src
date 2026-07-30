/* eslint-disable no-param-reassign */
import Packet from 'aedes-packet';
import sequelize from '../../sequelize';
import Workspace from '../../models/Workspace';
import AccessTokenReader from '../../models/AccessTokenReader';
import AedesBaseClient from './BaseClient';
import { createHash } from './utils';

export default class AedesAccessTokenReaderClient extends AedesBaseClient {
    constructor({ client, rootTopic, code }) {
        super({ client });
        this.rootTopic = rootTopic;
        this.code = code;
    }

    authorizePublish(packet, callback) {
        const topic = packet.topic;

        if (topic.startsWith(`sweet-home/${this.code}/`) || topic.startsWith(`errors/sweet-home/${this.code}/`)) {
            return callback(null, new Packet({
                ...packet,
                topic : `${this.rootTopic}/${topic}`
            }));
        }

        return callback(new Error('Bad publish'), null);// will disonnect client
        // return ;// will ignore this publish
    }

    authorizeSubscribe(sub, callback) {
        const topic = sub.topic;

        if (topic.startsWith(`sweet-home/${this.code}/`) || topic.startsWith(`errors/sweet-home/${this.code}/`)) {
            sub.topic = `${this.rootTopic}/${topic}`;

            return callback(null, sub);
        }

        return callback(new Error('Bad subscribe'), null);// will disonnect client
        // return callback(null, null);;// will ignore this publish
    }

    // eslint-disable-next-line no-unused-vars
    authorizeForward(packet) {
        if (!packet.topic.startsWith(`${this.rootTopic}/sweet-home/${this.code}/`) && !packet.topic.startsWith(`${this.rootTopic}/errors/sweet-home/${this.code}/`)) return null;

        return new Packet({
            ...packet,
            topic : packet.topic.slice(this.rootTopic.length + 1)
        });
    }

    static async authenticate(client, username, password) {
        // username format `reader/${rootTopic = SHA2(adminUser.login, 256)}/${code}}`
        const [ type, rootTopic, code ] = username.split('/');

        if (type !== 'reader') throw new Error('Bad credentials. type !== \'reader\'');

        const workspace = await this.getWorkspace({
            where : {
                [sequelize.Op.and] : [
                    { accessToken: password },
                    sequelize.where(sequelize.fn('SHA2', sequelize.col('$adminUser.login$'), 256), rootTopic)
                ]
            },
            include : [
                {
                    association : Workspace.AssociationAdminUser,
                    required    : true
                }
            ]
        });

        if (!workspace) throw new Error('Bad credentials');
        const { id: workspaceId } = workspace;

        const accessTokenReader = await AccessTokenReader.findOne({
            where : { workspaceId, code }
        });

        if (!accessTokenReader) throw new Error('Bad credentials. !accessTokenReader');

        return new AedesAccessTokenReaderClient({ client, rootTopic: createHash(workspace.adminUser.login), code });
    }
}
