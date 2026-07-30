const { Logger }   = require('../Logger');
const stateManager = require('../stateManager');

const logger = Logger('status');

module.exports = async function check(req, res) {
    logger.info('status');

    const { status, version, available_version, stage } = await stateManager.getState();

    res.status(200);

    return res.send({ status, version, available_version, stage });
};
