const { Logger }   = require('../Logger');
const stateManager = require('../stateManager');
const {
    STATUSES,
    STAGES
} = require('../constants/updater');

const logger = Logger('reset');

module.exports = async function reset(req, res) {
    logger.info('reset');

    const state = await stateManager.getState();

    await stateManager.setState({
        ...state,
        status : STATUSES.FREE,
        stage  : STAGES.EMPTY
    });

    const newState = await stateManager.getState();

    res.status(200);

    return res.send(newState);
};
