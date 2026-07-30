const { Logger }     = require('../Logger');
const eventsManagger = require('../eventsManagger');
const stateManager   = require('../stateManager');
const { STATUSES }   = require('../constants/updater');

const logger = Logger('check');

module.exports = async function check(req, res) {
    logger.info('check');
    const { status } = await stateManager.getState();

    if (status !== STATUSES.FREE) {
        res.status(403);

        return res.send({
            type    : 'forbidden',
            message : `Updater is busy in status: "${status}"`
        });
    }
    eventsManagger.runCheck();

    res.status(200);
    res.send({
        status : STATUSES.CHECKING
    });
};
