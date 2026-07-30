const { Logger }   = require('../Logger');
const stateManager = require('../stateManager');
const FilesApi     = require('../api/Files');
const { files }    = require('../../etc/config');

const filesApi = new FilesApi(files);

const logger = Logger('changelog');

module.exports = async function changelog(req, res) {
    try {
        logger.info('changelog');
        const locale = req.headers['accept-language'];

        const { version, updated_at } = await stateManager.getState();
        const changelogs = await filesApi.getLocalChangelogs(locale);

        res.status(200);

        return res.send({ version, updated_at, changelogs });
    } catch (error) {
        logger.error(error);
        if (error.stack) logger.debug(error.stack);
        res.status(500);

        return res.send({ error: error.message });
    }
};
