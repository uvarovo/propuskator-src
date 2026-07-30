const path          = require('path');
const { promisify } = require('util');
const childProcess  = require('child_process');
const { Logger }    = require('../Logger');

const exec   = promisify(childProcess.exec);
const logger = Logger('ComposeApi');

class ComposeApi {
    constructor(args) {
        this.projectName        = args.projectName;
        this.systemDir          = args.systemDir;
        this.mainComposeFile    = args.mainComposeFile;
        this.defaultEnvPath     = args.defaultEnvPath;
        this.serviceManagerName = args.serviceManagerName;
        this.updaterServiceName = args.updaterServiceName;
    }

    async recreateServices({ services, envFile, composeFiles }) {
        const isDevMode = process.env.NODE_ENV === 'development';
        // run with -p flag to be able to work with containers that was created on server
        // running this command without flag will create conflict between same services
        const command = isDevMode
            ? `docker-compose ${this._getFilesCmd(composeFiles)} -p ${this.projectName} --env-file ${envFile} up -d --force-recreate ${services.join(' ')}`
            : `docker-compose ${this._getFilesCmd(composeFiles)} -p ${this.projectName} --env-file ${envFile} up -d --force-recreate --remove-orphans ${services.join(' ')}`;

        logger.info(`servicesRecreate: Executing - ${command}`);
        const { stdout, stderr } = await exec(command, { cwd: this.systemDir });

        if (stdout) logger.debug(`servicesRecreate: stdout - ${JSON.stringify(stdout)}`);
        if (stderr) logger.warn(`servicesRecreate: stderr - ${JSON.stringify(stderr)}`);

        logger.info('servicesRecreate: System services recreated!');
    }

    async selfRecreate({ envFile, composeFiles }) {
        try {
            logger.info('selfRecreate: started');
            const command = `docker-compose ${this._getFilesCmd(composeFiles)} -p ${this.projectName} run ` +
            `-e DOCKER_COMPOSE_PATH=${path.join(this.systemDir, this.mainComposeFile)} ` +
            `-e PROJECT_NAME=${this.projectName} ` +
            `-e UPDATER_SERVICE_NAME=${this.updaterServiceName} ` +
            `-e ENV_PATH=${path.join(this.systemDir, envFile)} ` +
            `--entrypoint /app/run.sh --rm ${this.serviceManagerName}`;

            logger.info(`selfRecreate: Executing - ${command}`);

            // this will recreate 2smart-updater service
            const { stdout, stderr } = await exec(command, { cwd: this.systemDir });

            if (stdout) logger.debug(`selfRecreate: stdout - ${JSON.stringify(stdout)}`);
            if (stderr) logger.warn(`selfRecreate: stderr - ${JSON.stringify(stderr)}`);

            logger.info('selfRecreate: completed');
        } catch (error) {
            logger.error('selfRecreate: failed');
        }
    }

    _getFilesCmd(composeFiles) {
        if (!composeFiles.length) return '';

        const additionalComposeFiles = composeFiles
            .filter(file => !file.includes(this.mainComposeFile))
            .sort();
        const mainComposeWithPath = composeFiles.find(file => file.includes(this.mainComposeFile));

        return `-f ${[ mainComposeWithPath, ...additionalComposeFiles ].join(' -f ')}`;
    }
}

module.exports = ComposeApi;
