/* eslint-disable no-param-reassign */
import net from 'net';
import http from 'http';
import Aedes from 'aedes';
import Promise from 'bluebird';
// import express from 'express';
// import expressWebSocket from 'express-ws';
import websocketStream from 'websocket-stream';
import { authenticate } from './aedesClients';


export default class MqttProxy {
    constructor({ wsPort, port, ip = '0.0.0.0', mqttTransport, debug }) {
        // aedes own handlers
        this.handleAedesPreConnect = this.handleAedesPreConnect.bind(this);
        this.handleAedesAuthenticate = this.handleAedesAuthenticate.bind(this);
        this.handleAedesAuthorizePublish = this.handleAedesAuthorizePublish.bind(this);
        this.handleAedesAuthorizeSubscribe = this.handleAedesAuthorizeSubscribe.bind(this);
        this.handleAedesAuthorizeForward = this.handleAedesAuthorizeForward.bind(this);
        this.handleAedesPublished = this.handleAedesPublished.bind(this);
        this.handleAedesClientDisconnect = this.handleAedesClientDisconnect.bind(this);
        this.handleAedesError = this.handleAedesError.bind(this);
        this.handleAedesSubscribe = this.handleAedesSubscribe.bind(this);

        // proxy handlers
        this.handleMqttTransportConnect = this.handleMqttTransportConnect.bind(this);
        this.handleMqttTransportMessage = this.handleMqttTransportMessage.bind(this);
        this.handleMqttTransportOffline = this.handleMqttTransportOffline.bind(this);
        // this.handleAesesPublish = this.handleAesesPublish.bind(this);

        this.handleServerConnection = this.handleServerConnection.bind(this);

        this.serverConnections = {};
        this.aedesClients = {};
        this.aedes = new Aedes({
            preConnect         : this.handleAedesPreConnect,
            authenticate       : this.handleAedesAuthenticate,
            authorizePublish   : this.handleAedesAuthorizePublish,
            authorizeSubscribe : this.handleAedesAuthorizeSubscribe,
            authorizeForward   : this.handleAedesAuthorizeForward,
            published          : this.handleAedesPublished
        });
        this.initialized = false;
        this.initializing = false;
        this.destroying = false;
        this.server = null;
        this.mqttTransport = mqttTransport;
        this.debug = debug;
        this.serverConfig = {
            wsPort, port, ip
        };
    }

    async init() {
        if (this.destroying) throw new Error('Cannot init while destroy');
        if (this.initializing || this.initialized) return;
        this.debug.info('Initializing');
        this.initializing = true;
        this.mqttTransport.on('connect', this.handleMqttTransportConnect);
        this.mqttTransport.on('message', this.handleMqttTransportMessage);
        this.mqttTransport.on('offline', this.handleMqttTransportOffline);
        this.aedes.on('clientDisconnect', this.handleAedesClientDisconnect);
        this.aedes.on('error', this.handleAedesError);
        this.aedes.on('subscribe', this.handleAedesSubscribe);
        // await Promise.fromCallback(cb => this.aedes.mq.on('#', this.handleAesesPublish, cb));
        if (this.serverConfig.port) await this.startServer();
        if (this.serverConfig.wsPort) await this.startWsServer();
        await this.mqttTransport.connect();
        await Promise.fromCallback(cb => this.mqttTransport.subscribe('#', cb));
        this.initializing = false;
        this.initialized = true;
        this.debug.info('Initialized');
    }

    async destroy() {
        if (this.initializing) throw new Error('Cannot destroy while init');
        if (this.destroying || !this.initialized) return;
        this.destroying = true;
        await Promise.fromCallback(cb => this.mqttTransport.unsubscribe('#', cb));
        await Promise.fromCallback(cb => this.mqttTransport.end(false, cb));
        if (this.server) await this.stopServer();
        if (this.wsServer) await this.stopWsServer();
        this.mqttTransport.off('connect', this.handleMqttTransportConnect);
        this.mqttTransport.off('message', this.handleMqttTransportMessage);
        this.aedes.off('clientDisconnect', this.handleAedesClientDisconnect);
        this.aedes.off('error', this.handleAedesError);
        this.aedes.off('subscribe', this.handleAedesSubscribe);
        this.destroying = false;
        // await Promise.fromCallback(cb => this.aedes.mq.removeListener('#', this.handleAesesPublish, cb));
    }

    async startServer() {
        if (this.server) throw new Error('Server is already initialized');
        this.server = net.createServer(this.aedes.handle);

        this.server.on('connection', this.handleServerConnection);

        await Promise.fromCallback(cb => {
            this.debug.info(`Listen on mqtt port ${this.serverConfig.port}`);
            this.server.listen(this.serverConfig.port, this.serverConfig.ip, cb);
        });
    }

    async handleServerConnection(conn) {
        const key = `${conn.remoteAddress  }:${  conn.remotePort}`;

        this.serverConnections[key] = conn;
        conn.on('close', () => {
            delete this.serverConnections[key];
        });
    }

    async stopServer() {
        if (!this.server) throw new Error('Server is not initialized');
        await Promise.fromCallback(cb => {
            this.server.close(cb);
            this.destroyExistingConnections();
        });
        this.server = null;
    }

    destroyExistingConnections() {
        this.debug.info('destroying existing http connections');

        Object.values(this.serverConnections).forEach(connection => connection.destroy());
    }

    async startWsServer() {
        if (this.wsServer) throw new Error('Server is already initialized');

        const server = http.createServer();

        this.wsServer = websocketStream.createServer(
            {
                server,
                perMessageDeflate : false // details: https://github.com/maxogden/websocket-stream#optionspermessagedeflate
            },
            this.aedes.handle
        );

        await Promise.fromCallback(cb => {
            this.debug.info(`Listen on ws port ${this.serverConfig.wsPort}`);
            server.listen(this.serverConfig.wsPort, this.serverConfig.ip, cb);
        });
    }

    async stopWsServer() {
        if (!this.wsServer) throw new Error('WebSocket server is not initialized');
        await Promise.fromCallback(cb => this.wsServer.close(cb));
        this.wsServer = null;
    }

    destroyExistingWsConnections() {
        this.debug.info('destroying existing ws connections');

        this.wsServer?.clients?.forEach(client => client.terminate());
    }

    addAedesClient(aedesClient) {
        if (this.aedesClients[aedesClient.id]) throw new Error('Already exists');
        this.aedesClients[aedesClient.id] = aedesClient;
    }

    removeAedesClient(id) {
        delete this.aedesClients[id];
    }

    getAedesClient(id) {
        return this.aedesClients[id];
    }


    // handlers
    // we can enforce some connection limits here
    async handleAedesPreConnect(client, packet, callback) {
        this.debug.info(`received preConnect packet from ${client.id}`);

        const error = this.mqttTransport.isConnected() ? null : new Error('connection error');
        const success = this.mqttTransport.isConnected();

        if (error) this.debug.warn('MQTT transport is not connected now');

        // reject new connections while MQTT transport is offline
        callback(error, success);
    }

    // we can enforce some connection limits here
    async handleAedesAuthenticate(client, username, password, callback) {
        this.debug.info(`received authenticate packet from ${client.id}`);
        try {
            const aedesClient = await authenticate(client, username, password.toString());

            if (aedesClient) {
                this.addAedesClient(aedesClient);

                return callback(null, true);
            }

            return callback(new Error('Bad credentials'), false);
        } catch (e) {
            this.debug.error(e);

            return callback(e, false);
        }
    }

    async handleAedesAuthorizePublish(client, packet, callback) {
        if (!client) return null;
        this.debug.info(`client ${client.id} published ${packet.topic}`);
        const aedesClient = this.getAedesClient(client.id);

        const wrappedCallback = (err, p) => {
            if (!err && packet) this.mqttTransport.publish(p.topic, p.payload, p);
            callback(err, p);
        };

        if (aedesClient) {
            return aedesClient.authorizePublish(packet, wrappedCallback);
        }

        return callback(new Error('Not permitted'));
    }

    async handleAedesAuthorizeSubscribe(client, sub, callback) {
        if (!client) return null;
        const aedesClient = this.getAedesClient(client.id);

        if (aedesClient) {
            return aedesClient.authorizeSubscribe(sub, callback);
        }

        return callback(new Error('Not permitted'));
    }


    handleAedesAuthorizeForward(client, packet) {
        if (!client) return null;
        if (packet.topic.startsWith('$SYS/')) return null;
        this.debug.verbose(`forward ${packet.topic} to client ${client.id}`);

        const aedesClient = this.getAedesClient(client.id);

        if (aedesClient) {
            return aedesClient.authorizeForward(packet);
        }

        return null;
    }

    async handleAedesPublished(packet, client, callback) {
        callback(null);
    }

    async handleAedesClientDisconnect(client) {
        this.debug.info(`client ${client.id} disconnected`);
        this.removeAedesClient(client.id);
    }

    async handleAedesError(error) {
        this.debug.error(error);
    }

    async handleAedesSubscribe(subscriptions, client) {
        this.debug.info(`${client.id} subscribed`);
    }

    // async handleAesesPublish(packet, done) {
    //     // skip $SYS topics
    //     // if (packet.topic.startsWith('$SYS/')) return;
    //     // if (this.mqttTransport.connected) {
    //     //     this.mqttTransport.publish(packet.topic, packet.payload, packet);
    //     // }

    //     done();
    // }

    async handleMqttTransportConnect() {
        // clear the storage, cause we are about to receive new topics
        this.aedes.persistence._retained = [];
        if (this.serverConfig.port && !this.server) await this.startServer();
        if (this.serverConfig.wsPort && !this.wsServer) await this.startWsServer();
    }

    handleMqttTransportOffline() {
        this.debug.info('handle MQTT transport offline event');

        if (this.server) this.destroyExistingConnections();
        if (this.wsServer) this.destroyExistingWsConnections();
    }

    async handleMqttTransportMessage(topic, message, { retain }) {
        this.debug.verbose(`received ${topic} from mqtt`);
        this.aedes.publish({
            retain,
            topic,
            payload : message
        }, error => {
            if (error) this.debug.error(error);
        });
    }
}
