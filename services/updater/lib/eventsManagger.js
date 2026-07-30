const { EventEmitter } = require('events');
const { Logger }       = require('../lib/Logger');

const logger = Logger('EventsManager');

class EventsManager extends EventEmitter {
    constructor() {
        super();
    }

    runCheck() {
        logger.verbose('Emiting "run_check"');
        this.emit('run_check');
    }

    runUpdate() {
        logger.verbose('Emiting "run_update"');
        this.emit('run_update');
    }

    setHandleCheck(handler) {
        logger.verbose('setting handler for "run_check"');
        this.on('run_check', handler);
    }

    setHandleUpdate(handler) {
        logger.verbose('setting handler for "run_update"');
        this.on('run_update', handler);
    }
}

module.exports = new EventsManager();
