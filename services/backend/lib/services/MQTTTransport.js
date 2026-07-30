/* eslint-disable no-param-reassign */
/* istanbul ignore file */
/* eslint-disable no-unused-vars */
import EventEmitter from 'events';
import Promise from 'bluebird';
import mqtt from 'mqtt';

export default class MQTTTransport extends EventEmitter {
    constructor({
        rootTopic,
        uri,
        retain = true,
        username = '',
        password = '',
        tls = { enable: false, selfSigned: false },
        will = null,
        session = null,
        debug
    }) {
        super();
        this.handleConnect = this.handleConnect.bind(this);
        this.handleReconnect = this.handleReconnect.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.handleDisconnect = this.handleDisconnect.bind(this);
        this.handleOffline = this.handleOffline.bind(this);
        this.handleEnd = this.handleEnd.bind(this);
        this.handleMessage = this.handleMessage.bind(this);
        this.handlePacketSend = this.handlePacketSend.bind(this);
        this.handlePacketReceive = this.handlePacketReceive.bind(this);
        this.handleError = this.handleError.bind(this);

        this.rootTopic = rootTopic || null;
        this.client = null;
        this.retain = retain;
        this.debug = debug;

        this.mqttOptions = {
            uri,
            clientId           : session || `session_${Math.random().toString(16).substr(2, 8)}`,
            username,
            password,
            rejectUnauthorized : !Boolean(tls.enable && tls.selfSigned),
            will,
            clean              : true
        };
    }

    async connect() {
        if (this.client) {
            if (this.client.disconnecting) {
                await new Promise((resolve, reject) => {
                    this.client.once('close', () => {
                        resolve();
                    });
                });
            } else {
                if (this.client.connected) return;

                return new Promise((resolve, reject) => {
                    this.client.once('connect', () => {
                        resolve();
                    });
                });
            }
        }

        return new Promise(resolve => {
            this.client =  mqtt.connect(this.mqttOptions.uri, this.mqttOptions);

            this.client.on('message', this.handleMessage);
            this.client.on('connect', this.handleConnect);
            this.client.once('connect', resolve);
            this.client.on('reconnect', this.handleReconnect);
            this.client.on('close', this.handleClose);
            this.client.on('disconnect', this.handleDisconnect);
            this.client.on('offline', this.handleOffline);
            this.client.on('error', this.handleError);
            this.client.on('end', this.handleEnd);
            this.client.on('packetsend', this.handlePacketSend);
            this.client.on('packetreceive', this.handlePacketReceive);
        });
    }

    publish(topic, message, options = {}, cb = () => {}) {
        if (this.rootTopic) topic = `${this.rootTopic}/${topic}`;

        this.client.publish(topic, `${message}`, { retain: this.retain, ...options }, cb);
    }

    subscribe(topic, cb = () => {}) {
        const origintopic = topic;

        if (this.rootTopic) {
            if (Array.isArray(topic)) topic = topic.map(t => `${this.rootTopic}/${t}`);
            else topic = `${this.rootTopic}/${topic}`;
        }

        this.client.subscribe(topic, {}, {}, (err, granted) => {
            if (err) this.handleError(err);
            else this.emit('subscribed', origintopic);
            cb(err, origintopic);
        });
    }

    unsubscribe(topic, cb = () => {}) {
        const origintopic = topic;

        if (this.rootTopic) {
            if (Array.isArray(topic)) topic = topic.map(t => `${this.rootTopic}/${t}`);
            else topic = `${this.rootTopic}/${topic}`;
        }

        this.client.unsubscribe(topic, {}, {}, (err, granted) => {
            if (err) this.handleError(err);
            else this.emit('unsubscribed', origintopic);
            cb(err, origintopic);
        });
    }

    end(force = false, cb = () => {}) {
        this.client.end(force, {}, cb);
    }

    reconnect() {
        this.client.reconnect();
    }

    handleConnect(connack) {
        this.connected = true;
        this.debug.info(`CONNECTED TO ${this.mqttOptions.uri}`);
        this.emit('connect');
    }

    handleReconnect() {
        this.emit('reconnect');
    }

    handleClose() {
        if (this.connected) {
            this.connected = false;
            this.debug.info(`DISCONNECTED FROM ${this.mqttOptions.uri}`);
        }
        this.emit('close');
    }

    handleDisconnect(packet) {
        this.emit('disconnect');
    }

    handleOffline() {
        this.emit('offline');
    }

    handleEnd() {
        this.emit('end');
    }

    handleMessage(topic, message, packet) {
        if (this.rootTopic) {
            if (topic.slice(0, this.rootTopic.length + 1) === `${this.rootTopic}/`) {
                topic = topic.slice(this.rootTopic.length + 1);
            } else return; // ignore
        }
        this.emit('message', topic, message, packet);
    }

    handlePacketSend(packet) {
        this.emit('packetsend', packet);
    }

    handlePacketReceive(packet) {
        this.emit('packetreceive', packet);
    }

    handleError(error) {
        this.emit('error', error);
    }
}

