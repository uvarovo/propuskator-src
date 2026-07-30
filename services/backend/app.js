/* eslint-disable import/imports-first */
import './lib/setDefaultValuesForEmptyEnvs';

import path                         from 'path';
import { promisify }                from 'bluebird';
import express                      from 'express';
import fse                          from 'fs-extra';

import {
    appPort,
    staticPath,
    intervals,
    reportsRecieverEmail,
    accessCameras,
    s3
}                              from './lib/config.js';
import sequelize               from './lib/sequelize';
import middlewares             from './lib/api/middlewares.js';
import {
    adminRouter,
    tokenReaderRouter,
    mobileRouter,
    servicesRouter
}                              from './lib/api/routes';
import { tokenReadersManager } from './lib/managers/tokenReadersManager';
import { errorHandler }        from './lib/api/errorHandler';
import { initLogger }          from './lib/extensions/Logger';
import mqttTransport           from './lib/services/mqttTransportSingleton';
import IssueProcessor          from './lib/IssuesProcessor';
import ProcessRunner           from './lib/ProcessRunner';
import { camerasManager }      from './lib/managers/camerasManager';

const ACCESS_CAMERAS_FRAMES_DIR_PATH = path.join(
    __dirname,
    staticPath,
    accessCameras.staticDirPath,
    accessCameras.framesDir
);

// eslint-disable-next-line no-sync
fse.mkdirpSync(`${staticPath}/admin-users`);
// eslint-disable-next-line no-sync
fse.mkdirpSync(`${staticPath}/access-subjects`);
// eslint-disable-next-line no-sync
fse.mkdirpSync(`${staticPath}/csv-export/access-subjects-tokens`);
// eslint-disable-next-line no-sync
fse.mkdirpSync(`${staticPath}/csv-export/access-subjects`);
// eslint-disable-next-line no-sync
fse.mkdirpSync(ACCESS_CAMERAS_FRAMES_DIR_PATH);

const logger    = initLogger();
const appLogger = initLogger('[App]');

// temporarily disable clearing notifications
// notificationsManager.init();

// Init app
const app = express();

app.use(middlewares.json);
app.use(middlewares.text);
app.use(middlewares.urlencoded);
app.use(middlewares.cors);
app.use(middlewares.cls);
app.use(middlewares.useragent);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/mobile', mobileRouter);
app.use('/api/v1/token-reader', tokenReaderRouter.v1);
app.use('/api/v2/token-reader', tokenReaderRouter.v2);
app.use('/access-bucket/cameras/:rtspUrlHash',
    middlewares.checkPermissionsToBucketCamerasMedia,
    middlewares.createProxyMiddleware({ target: s3.endpoint })
);

// TODO: maybe additional middleware needed for higher security?
app.use('/api/v1/services-api', servicesRouter);

app.use('/node-static', express.static('storage'));
app.use('/assets', express.static('assets'));
app.use('/instructions', express.static('etc/instructions'));
app.use(errorHandler);

mqttTransport.connect();
mqttTransport.subscribe('#');
mqttTransport.on('error', e => {
    logger.error('[MqttTransport] Error', e);
});

let server = null;

async function start({ appPort }) { // eslint-disable-line no-shadow
    server = app.listen(appPort, () => {
        const { port, address } = server.address();

        logger.info(`[RestApiApp] STARTING AT PORT [${port}] ADDRESS [${address}]`);
    });

    server.closeAsync = promisify(server.close);
}

async function stop() {
    if (!server) return;

    logger.info('[RestApiApp] Closing server');

    await server.closeAsync();
}

// TODO: move the main function to a separate module and properly configure the babel
const RestApi = { start, stop };

async function shutdown() {
    await RestApi.stop();

    appLogger.info('Closing sequelize connections');

    await sequelize.close();

    appLogger.info('Exit');

    process.exit(0);
}

async function main() {
    process.on('SIGTERM', async () => {
        appLogger.info('SIGTERM signal was caught');

        await shutdown();
    });

    process.on('SIGINT', async () => {
        appLogger.info('SIGINT signal was caught');

        await shutdown();
    });

    process.on('unhandledRejection', err => {
        console.error(err);

        appLogger.error({
            type  : 'UnhandledRejection',
            error : err.stack
        });
    });

    process.on('uncaughtException', err => {
        console.error(err);

        appLogger.error({
            type  : 'UncaughtException',
            error : err.stack
        });
    });

    const issueProcessor = new IssueProcessor({
        recieverEmail : reportsRecieverEmail
    });

    const issueRunner = new ProcessRunner({
        processor : issueProcessor,
        interval  : intervals.reportSend
    });

    issueRunner.start();

    tokenReadersManager.init();

    await RestApi.start({ appPort });

    await camerasManager.init({ framesDirPath: ACCESS_CAMERAS_FRAMES_DIR_PATH });

    camerasManager.on('error', e => {
        logger.error('[CamerasManager] Error', e);
    });
}

main().catch(err => {
    console.error(err);

    process.exit(1);
});

export default app;
