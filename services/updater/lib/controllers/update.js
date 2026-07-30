const { Logger }     = require('../Logger');
const eventsManagger = require('../eventsManagger');
const stateManager   = require('../stateManager');
const { STATUSES }   = require('../constants/updater');

const logger = Logger('update');

module.exports = async function check(req, res) {
    logger.info('update');
    const { status } = await stateManager.getState();

    logger.debug({ status });

    if (status !== STATUSES.FREE) {
        res.status(403);

        return res.send({
            type    : 'forbidden',
            message : `Updater is busy in status: "${status}"`
        });
    }

    eventsManagger.runUpdate();

    res.status(200);

    return res.send({
        status : STATUSES.UPDATING
    });
};
