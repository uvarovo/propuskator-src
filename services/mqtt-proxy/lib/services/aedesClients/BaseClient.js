export default class AedesAbstactClient {
    constructor({ client }) {
        this.client = client;
        this.id = client.id;
    }

    authorizePublish(packet, callback) {
        callback(new Error('Not permitted'));
    }

    authorizeSubscribe(sub, callback) {
        callback(new Error('Not permitted'));
    }

    // eslint-disable-next-line no-unused-vars
    authorizeForward(packet) {
        return null;
    }
}
