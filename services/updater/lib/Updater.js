/* eslint-disable no-sync */
const path           = require('path');
const _slice         = require('lodash/slice');
const _reverse       = require('lodash/reverse');
const config         = require('../etc/config');
const eventsManagger = require('./eventsManagger');
const stateManager   = require('./stateManager');
const { Logger }     = require('./Logger');
const DockerApi      = require('./api/Docker');
const ReleaseApi     = require('./api/Release');
const ComposeApi     = require('./api/Compose');
const FilesApi       = require('./api/Files');
const LOCALES        = require('./constants/locales');
const {
    STATUSES,
    STAGES
} = require('./constants/updater');

const logger = Logger('Updater');
const dockerComposeYml = config.compose.mainComposeFile;
const envFile = '.env';

class Updater {
    constructor() {
        this.services               = {};
        this.updaterServiceName     = config.compose.updaterServiceName;
        this.projectName            = config.compose.projectName;
        this.dockerApi              = new DockerApi(config.docker);
        this.ignoreYmlFiles         = config.files.ignoreYmlFiles.split(';');
        this.syncYmlFiles           = config.files.syncYmlFiles.split(';');
        this.defaultEnvPath         = path.join(config.files.systemDir, envFile);
        this.releaseApi             = new ReleaseApi(config.releases);
        this.composeApi             = new ComposeApi({
            ...config.compose,
            ...config.files
        });
        this.filesApi               = new FilesApi(config.files);
        this.additionalComposeFiles = [];
        this.composeFiles           = [];
    }

    async init() {
        logger.info('Initialialize updater');
        eventsManagger.setHandleCheck(this.check.bind(this));
        eventsManagger.setHandleUpdate(this.update.bind(this));

        await stateManager.init();
        await this.sync();
        await this.check();
    }

    async update() {
        try {
            const { version, available_version } = await stateManager.getState();

            if (version === available_version) {
                logger.info('update: No update available');

                return;
            }

            logger.info('update: started');
            await stateManager.setState({ status: STATUSES.UPDATING });

            logger.verbose('update: begin downloadDockerComposes');
            await this.downloadDockerComposes();
            logger.verbose('update: begin syncServices');
            await this.syncServices();
            logger.verbose('update: begin pullImages');
            await this.pullImages();
            logger.verbose('update: begin downloadChangelogs');
            await this.downloadChangelogs();
            logger.verbose('update: begin recreateServices');
            await this.recreateServices();
            logger.verbose('update: begin syncVersion');
            await this.syncVersion();
            logger.info('update: completed');
        } catch (error) {
            logger.error('update: failed');
            logger.error(error);
            if (error.stack) logger.debug(error.stack);
            await stateManager.setState({ status: STATUSES.FREE, stage: STAGES.EMPTY });
        }
    }

    async check() {
        logger.info('check started');
        try {
            await stateManager.setState({ status: STATUSES.CHECKING });
            const version = await this._getCurrentVersion();
            const available_version = await this._getAvailableVersion();

            await stateManager.setState({
                version,
                available_version,
                status : STATUSES.FREE,
                stage  : STAGES.EMPTY,
                error  : ''
            });
            logger.info('check completed');
        } catch (error) {
            logger.error('check: failed');
            logger.error(error);
            await stateManager.setState({ status: STATUSES.FREE, stage: STAGES.EMPTY });
        }
    }

    async _getCurrentVersion() {
        const state = await stateManager.getState();

        logger.verbose(`Current version: ${state.version}`);

        return state.version;
    }

    async _getAvailableVersion() {
        const latestRelease = await this.releaseApi.getLatestVersion();

        logger.verbose(`Latest version: ${latestRelease}`);

        return latestRelease;
    }

    async sync() {
        logger.info('sync: started');

        await this.syncVersion();
        await this.syncServices();

        logger.silly(this.services);
        logger.info('sync: completed');
    }

    async syncVersion() {
        logger.info('syncVersion: started');
        const { available_version, version, status } =  await stateManager.getState();

        logger.verbose(`Current version: ${version}, status ${status}`);

        if (status !== STATUSES.UPDATING) return;
        logger.info(`syncVersion: update version to ${available_version}`);

        return stateManager.setState({
            version    : available_version,
            status     : STATUSES.FREE,
            updated_at : new Date().toISOString()
        });
    }

    async syncServices() {
        logger.info('syncServices: started');
        await stateManager.setState({ stage: STAGES.SYNC_SERVICES });

        this.services = await this.filesApi.getServicesFromComposes({
            currentServices : this.services,
            dockerComposeYml
        });
        this.composeFiles = await this.filesApi.getComposeFiles();

        await Promise.all(Object.keys(this.services).map(
            this._syncServiceDigests.bind(this)
        ));

        logger.info('syncServices: completed');
        logger.debug(this.services);
    }

    async _syncServiceDigests(serviceName) {
        const service = this.services[serviceName];
        const { image, container } = service;

        try {
            logger.verbose(`_syncServiceDigests: Check image digest - ${image}`);
            const { Id, Created } = await this.dockerApi.inspectImage(image);

            service.digest.image = Id;
            service.createdAt = Created;

            logger.verbose(`_syncServiceDigests: Check image digest in container - ${container}`);

            const { Image, Config } = await this.dockerApi.inspectContainer(container);

            service.digest.container = Image;
            service.containerImage = Config.Image;

            // define project name to use same docker-compose context in container
            // default project name equals dir name where docker-compose is stored
            if (Config.Labels['com.docker.compose.project'] && !this.projectName) {
                this.projectName = Config.Labels['com.docker.compose.project'] || 'cloud';
            }
        } catch (e) {
            logger.error(`_syncServiceDigests: failed (image ${image}, container ${container})`);
            logger.error(e);
            if (e.stack) logger.debug(e.stack);
        }
    }

    async pullImages() {
        logger.info('pullImages: started');
        logger.debug(`pullImages: ${JSON.stringify(this.services)}`);
        await stateManager.setState({ stage: STAGES.PULL_IMAGES });

        try {
            for (const name of Object.keys(this.services)) {
                const service = this.services[name];
                const { image } = service;

                try {
                    await this.dockerApi.pullImage(image);

                    const { Id, Created } = await this.dockerApi.inspectImage(image);

                    service.digest.image = Id;
                    service.createdAt = Created;
                } catch (error) {
                    logger.warn(`pullImages: Failed to pull ${image}`);
                    await stateManager.setState({ error: `pullImages: Failed to pull ${image}` });
                    throw error;
                }
            }
        } catch (e) {
            logger.warn('pullImages: failed');
            logger.warn(e);
            throw e;
        }

        logger.info('pullImages: completed');
    }

    async downloadDockerComposes() {
        logger.info('downloadDockerComposes: started');
        await stateManager.setState({ stage: STAGES.DOWNLOAD_DOCKER_COMPOSES });
        for (const fileName of this.syncYmlFiles) {
            try {
                const data = await this.releaseApi.getDockerCompose(fileName);

                await this.filesApi.writeDockerCompose(fileName, data);
            } catch (e) {
                logger.warn(`downloadDockerComposes: failed get dockerCompose ${fileName}`);
                stateManager.setState({ error: `downloadDockerComposes: failed get dockerCompose ${fileName}` });
                throw e;
            }
        }
        logger.info('downloadDockerComposes: completed');
    }

    async downloadChangelogs() {
        try {
            logger.verbose('downloadChangelogs: started');

            const releasesList = await this.releaseApi.getReleaseList();
            const changelogFilenames = _slice(_reverse(releasesList.replace('\n', '').split(',')), 0, 3);

            logger.info(`downloadChangelogs: ${JSON.stringify(changelogFilenames)}`);

            const changelogsMap = {};

            await Promise.all(changelogFilenames.map(async (filename, key) => {
                for (const locale in LOCALES) {
                    if (!LOCALES[locale]) continue;
                    try {
                        const changelogText = await this.releaseApi.getChangelog(filename, LOCALES[locale]);

                        await this.filesApi.whriteChangeLog(`${key}.md`, LOCALES[locale], changelogText);
                        changelogsMap[filename] = changelogText;
                    } catch (error) {
                        logger.error(`Failed to download changelog ${filename}`);
                    }
                }
            }));

            logger.verbose('downloadChangelogs: completed');
        } catch (e) {
            logger.error(e);

            throw e;
        }
    }

    _getServicesToUpdate() {
        logger.info('_getServicesToUpdate: Filter services to update');
        const servicesToUpdate = [];

        for (const name in this.services) {
            if (!this.services[name]) continue;
            // To update service itself it should trigger 2smart-updater-manager service
            // because when docker-compose should update container config it kills it
            // and 2smart-updater can't update itself
            if (name === this.updaterServiceName) continue;
            const {
                image,
                containerImage,
                digest: {
                    image     : imageDigest,
                    container : containerDigest
                }
            } = this.services[name];

            logger.debug({ imageDigest, containerDigest, image, containerImage });
            if (imageDigest !== containerDigest || image !== containerImage) {
                servicesToUpdate.push(name);
            }
        }

        return servicesToUpdate;
    }

    _isSelfUpdate() {
        for (const name in this.services) {
            if (!this.services[name]) continue;
            const {
                image,
                containerImage,
                digest: {
                    image     : imageDigest,
                    container : containerDigest
                }
            } = this.services[name];

            const isImageDigestMismatch = imageDigest !== containerDigest || image !== containerImage;

            if (isImageDigestMismatch && name === this.updaterServiceName) return true;
        }

        return false;
    }

    async recreateServices() {
        logger.info('recreateServices: started');
        await stateManager.setState({ stage: STAGES.RECREATE_SERVICES });

        try {
            await this.syncServices();

            logger.info('recreateServices: Compose synced!');
            logger.info(`recreateServices: Project name - ${this.projectName}`);

            // possible error when project name is not defined
            // an error will occur on "docker-compose up -d" execution
            if (!this.projectName) throw new Error('Project name is not defined!');

            const isSelfUpdate = this._isSelfUpdate();
            const servicesToUpdate = this._getServicesToUpdate();

            logger.info(`recreateServices: serices to update - ${JSON.stringify(servicesToUpdate)}`);
            logger.info(`recreateServices: updater service update available - ${isSelfUpdate}`);

            if (servicesToUpdate.length) {
                await this.composeApi.recreateServices({
                    services     : servicesToUpdate,
                    envFile,
                    composeFiles : this.composeFiles
                });
            }

            if (isSelfUpdate) {
                await this.composeApi.selfRecreate({
                    envFile,
                    composeFiles : this.composeFiles
                });
            }
        } catch (e) {
            logger.error(e);
            throw e;
        }

        logger.info('recreateServices: Clear cache');

        // clear cached info about services after update
        this._clearServices();

        this.dockerApi.pruneImages();

        logger.info('recreateServices: completed');
    }

    _clearServices() {
        this.services = {};
    }
}

module.exports = Updater;
