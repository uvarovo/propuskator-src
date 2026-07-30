const request    = require('request-promise');
const { Logger } = require('../Logger');

const logger     = Logger('ReleaseApi');

class ReleaseApi {
    constructor({ storageUrl, changelogPath, dockerComposesPath, releasesListPath }) {
        this.storageUrl         = storageUrl;
        this.changelogPath      = changelogPath;
        this.releasesListPath   = releasesListPath;
        this.dockerComposesPath = dockerComposesPath;
    }

    getDockerCompose(filename) {
        logger.debug(`getDockerCompose from ${this.storageUrl}/${this.dockerComposesPath}/${filename}`);

        return request({
            uri : `${this.storageUrl}/${this.dockerComposesPath}/${filename}`
        });
    }

    getReleaseList() {
        logger.debug(`getReleaseList from ${this.storageUrl}/${this.releasesListPath}`);

        return request({
            uri : `${this.storageUrl}/${this.releasesListPath}`
        });
    }

    getChangelog(filename, locale = 'en') {
        if (!filename) throw new Error('Filename is required!');
        logger.debug(`getChangelog from ${this.storageUrl}/${this.changelogPath}/${locale}/${filename}`);

        return request({
            uri : `${this.storageUrl}/${this.changelogPath}/${locale}/${filename}`
        });
    }

    async getLatestVersion() {
        logger.debug(`getLatestVersion from ${this.storageUrl}/${this.releasesListPath}`);
        const releasesString = await request({
            uri : `${this.storageUrl}/${this.releasesListPath}`
        });

        const releases = releasesString.split(',');

        const [ latestRelease ] = releases[releases.length - 1].split('.');

        return latestRelease;
    }
}

module.exports = ReleaseApi;
