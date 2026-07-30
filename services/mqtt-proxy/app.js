import sequelize from './lib/sequelize';
// import { notificationsManager }  from './lib/managers/notificationsManager';
import { initLogger }   from './lib/extensions/Logger';
import mqttTransport   from './lib/services/mqttTransportSingleton';
import MqttProxy   from './lib/services/MqttProxy';
// eslint-disable-next-line import/named
import { aedes } from './lib/config';

const logger = initLogger('App');

mqttTransport.on('error', e => {
    logger.error(e);
});

const mqttProxy = new MqttProxy({
    port   : aedes.port,
    wsPort : aedes.wsPort,
    mqttTransport,
    debug  : initLogger('MqttProxy')
});

async function start() {
    try {
        await mqttProxy.init();
    } catch (e) {
        console.log(e);
        logger.error(e);
        process.exit(1);
    }
}

async function shutdown() {
    logger.info('Closing sequelize connections');
    await mqttProxy.destroy();

    await sequelize.close();

    logger.info('Exit');
    process.exit(0);
}

// Subscribe to system signals
process.on('SIGTERM', async () => {
    logger.info('SIGTERM signal catched');

    await shutdown();
});

process.on('SIGINT', async () => {
    logger.info('SIGINT signal catched');

    await shutdown();
});

start();
