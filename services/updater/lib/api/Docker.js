/* eslint-disable no-param-reassign */
const request    = require('request-promise');
const Docker     = require('dockerode');
const config     = require('../../etc/config');
const { Logger } = require('../Logger');

const logger = Logger('DockerApi');

class DockerApi {
    constructor({ host, auth, gitlabHost, socketPath = '/var/run/docker.sock' }) {
        this.host       = host;
        this.auth       = auth;
        this.gitlabHost = gitlabHost;
        this.docker     = new Docker({ socketPath });
    }

    async inspectImage(image) {
        try {
            const { Id, Created } = await this.docker.getImage(image).inspect();

            return {
                Id,
                Created : new Date(Created).getTime()
            };
        } catch (error) {
            logger.error(`inspectImage for ${image} failed`);
            throw error;
        }
    }

    async inspectContainer(container) {
        try {
            return this.docker.getContainer(container).inspect();
        } catch (error) {
            logger.error(`inspectContainer ${container} failed`);
            throw error;
        }
    }

    async getBearerToken(image) {
        const { repository } = this._parseRepository(image);

        return request({
            uri  : `https://${this.gitlabHost}/jwt/auth`,
            auth : this.auth,
            qs   : { client_id: 'docker', service: 'container_registry', scope: `repository:${repository}:pull` },
            json : true
        });
    }

    async getRepositoryDigest(image, token = undefined) {
        const { repository, tag } = this._parseRepository(image);

        if (!token) token = await this.getBearerToken(image);

        const { config: { digest } }  = await request({
            uri     : `https://${this.host}/v2/${repository}/manifests/${tag}`,
            auth    : { bearer: token },
            headers : {
                'Accept' : 'application/vnd.docker.distribution.manifest.v2+json'
            },
            json : true
        });

        return digest;
    }

    async getImageCreationDate(image, token = undefined) {
        const { repository, tag } = this._parseRepository(image);

        if (!token) token = await this.getBearerToken(image);

        const { history }  = await request({
            uri     : `https://${this.host}/v2/${repository}/manifests/${tag}`,
            auth    : { bearer: token },
            headers : {
                'Accept' : 'application/vnd.docker.distribution.manifest.v1+json'
            },
            json : true
        });

        let latestDate;

        history.forEach(layer => {
            const info = JSON.parse(layer.v1Compatibility);

            if (!info.created) return;

            const date = new Date(info.created);

            if (!latestDate || latestDate < date) latestDate = date;
        });

        return latestDate;
    }

    async pullImage(image) {
        let stdout = '';

        try {
            logger.info(`pullImage: start pulling image ${image}`);
            const is2smartImage = image.search(config.docker.REGISTRY_SERVER) !== -1;
            const stream = await this.docker.pull(image, { 'authconfig': is2smartImage ? config.docker.auth : null });


            await new Promise((resolve) => {
                const go = () => { // eslint-disable-line
                    stream.off('close', go);
                    stream.off('end', go);
                    resolve();
                };

                stream.on('data', data => stdout += data.toString());
                stream.on('close', go);
                stream.on('end', go);
                stream.on('error', e => logger.warn(e));
            });

            logger.debug(`pullImage stdout: ${stdout}`);
            logger.debug(`pullImage: completed pulling image ${image}`);

            return stdout;
        } catch (error) {
            logger.error(`Failed to pull docker image ${image}`);
            throw error;
        }
    }

    async pruneImages() {
        try {
            logger.info('pruneImages: started');

            await this.docker.pruneImages();

            logger.info('pruneImages: completed');
        } catch (e) {
            logger.warn('pruneImages: failed');
            logger.warn(e);
        }
    }

    _parseRepository(data) {
        data = data.split(`${this.host}/`).pop();
        data = data.split(':');

        const repository = data[0];
        const tag = data[1] || 'latest';

        return { repository, tag };
    }
}

module.exports = DockerApi;
