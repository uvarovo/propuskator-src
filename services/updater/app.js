const express    = require('express');
const cors       = require('cors');
const router     = require('./lib/router');
const { port }   = require('./etc/config');
const { Logger } = require('./lib/Logger');
const Updater    = require('./lib/Updater');

const logger = Logger('app');

const updater = new Updater();

updater.init();

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use('/updater/v1', router);
// This is temporary mock for releases server
app.use('/releases', express.static('fixtures/releases'));

app.listen(port, () => {
    logger.info(`Running updater http server on port ${port}`);
});
