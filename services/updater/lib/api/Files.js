const path       = require('path');
const fse        = require('fs-extra');
const YAML       = require('yaml');
const dotenv     = require('dotenv');
const _merge     = require('lodash/merge');
const _diff      = require('lodash/difference');
const { Logger } = require('../Logger');
const LOCALES    = require('../constants/locales');

const logger     = Logger('FilesApi');

const envFile = '.env';

class FilesApi {
    constructor(args) {
        this.systemDir      = args.systemDir;
        this.changelogPath  = args.changelogPath;
        this.ignoreYmlFiles = args.ignoreYmlFiles.split(';');
        this.syncYmlFiles   = args.syncYmlFiles.split(';');
        this.defaultEnvPath = path.join(args.systemDir, envFile);
    }

    async writeDockerCompose(fileName, data) {
        const { services } = YAML.parse(data);
        const composePath = path.join(this.systemDir, fileName);

        logger.debug(`writeDockerCompose: filePath - ${composePath}`);
        if (!services) throw new Error('Wrong docker-compose format');

        // Q: do we need backup prev compose somwhere?
        // await fse.copy(composePath, `${composePath}_bkp`);

        return fse.writeFile(composePath, data);
    }

    async whriteChangeLog(fileName, locale, data) {
        const changelogPath = path.join(this.changelogPath, locale, fileName);

        logger.debug(`whriteChangeLog: filePath - ${changelogPath}`);

        await fse.ensureDir(path.join(this.changelogPath, locale));

        return fse.writeFile(changelogPath, data);
    }

    async getLocalChangelogs(locale = 'en') {
        const changelogs         = {};
        const localeFolder       = LOCALES[locale] || 'en';
        const changelogLocalized = path.join(this.changelogPath, localeFolder);
        const changelogFiles     =  await fse.readdir(changelogLocalized);

        for (const fileName of changelogFiles.sort()) {
            try {
                const changelog = await fse.readFile(path.join(changelogLocalized, fileName));

                changelogs[fileName] = changelog.toString();
            } catch (error) {
                logger.warn(`Failed to read changelog ${path.join(changelogLocalized, fileName)}`);
            }
        }

        return changelogs;
    }

    async getComposeFiles() {
        const fileNames = await fse.readdir(this.systemDir);

        const composeFiles = [];

        for (const fileName of fileNames) {
            const filePath = path.join(this.systemDir, fileName);
            const { ext } = path.parse(filePath);
            // ignore non .yml file
            // ignore main docker-compose file
            // ignore files from env config
            const isfileAdditional = ext === '.yml' && !this.ignoreYmlFiles.includes(fileName);

            if (isfileAdditional) composeFiles.push(filePath);
        }

        return composeFiles;
    }

    async getServicesFromComposes({ currentServices = {}, dockerComposeYml }) {
        const data = await fse.readFile(path.join(this.systemDir, dockerComposeYml), 'utf-8');
        const resultServices = JSON.parse(JSON.stringify(currentServices));
        const { services } = YAML.parse(data);

        this.composeFiles = await this.getComposeFiles();
        this.additionalComposeFiles = this.composeFiles.filter(fileName => fileName !== dockerComposeYml);
        this.additionalComposeFiles.forEach(file => {
            const fileData = fse.readFile(file, 'utf-8');
            const { services: overwrite } = YAML.parse(fileData.toString());

            _merge(services, overwrite);
        });

        if (this.additionalComposeFiles.length) logger.info(`getServicesFromComposes: ${this.additionalComposeFiles.join(', ')}`);

        // delete orphan services from collection
        _diff(Object.keys(resultServices), Object.keys(services))
            .forEach(orphanService => delete resultServices[orphanService]);

        for (const name in services) {
            if (!services[name]) continue;
            const defaultState = resultServices[name] || {
                name           : undefined,
                image          : undefined,
                container      : undefined,
                containerImage : undefined,
                createdAt      : undefined,
                updatedAt      : undefined,
                digest         : {
                    image     : undefined, // image digest in system
                    registry  : undefined, // image digest in registry
                    container : undefined  // image digest in container
                }
            };

            const image = this._resolveEnvVariable(services[name].image);

            resultServices[name] = {
                ...defaultState,
                name,
                image,
                container : services[name].container_name
            };
        }

        return resultServices;
    }

    _resolveEnvVariable(data) {
        let res = data;

        const envVars = dotenv.config({ path: this.defaultEnvPath }).parsed;
        const regex = /\$\{([^}^{]+)\}/g;
        const match = regex.exec(res);

        if (!match) return res;

        // split string by :- to check for default value
        const split = match[1].split(':-');

        switch (split.length) {
            case 1: // no default value
                res = res.replace(match[0], envVars[split[0]] || '');
                break;
            case 2: // default value specified
                res = res.replace(match[0], envVars[split[0]] || split[1]);
                break;
            default:
                break;
        }

        return res;
    }
}

module.exports = FilesApi;
