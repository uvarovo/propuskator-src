/* eslint-disable no-param-reassign */
import Packet from 'aedes-packet';
import AdminUser from '../../models/AdminUser';
import AedesBaseClient from './BaseClient';
import { createHash } from './utils';

export default class AedesAdminUserClient extends AedesBaseClient {
    constructor({ client, rootTopic }) {
        super({ client });
        this.rootTopic = rootTopic;
    }

    authorizePublish(packet, callback) {
        callback(null, new Packet({
            ...packet,
            topic : `${this.rootTopic}/${packet.topic}`
        }));
    }

    authorizeSubscribe(sub, callback) {
        sub.topic = `${this.rootTopic}/${sub.topic}`;
        callback(null, sub);
    }

    // eslint-disable-next-line no-unused-vars
    authorizeForward(packet) {
        if (!packet.topic.startsWith(`${this.rootTopic}/`)) return null;

        return new Packet({
            ...packet,
            topic : packet.topic.slice(this.rootTopic.length + 1)
        });
    }

    static async authenticate(client, username, password) {
        // username format `client/${login}`
        const [ type, login ] = username.split('/');

        if (type !== 'client') throw new Error('Bad credentials. type !== \'client\'');

        const adminUser = await AdminUser.findOne({ where: { login, mqttToken: password } });

        if (!adminUser) throw new Error('Bad credentials. !adminUser');

        return new AedesAdminUserClient({ client, rootTopic: createHash(adminUser.login) });
    }
}
