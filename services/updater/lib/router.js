const express     = require('express');
const controllers = require('./controllers');

const router = express.Router();

router.get('/check',     controllers.check);
router.get('/status',    controllers.status);
router.get('/update',    controllers.update);
router.get('/changelog', controllers.changelog);
router.get('/reset',     controllers.reset);

module.exports = router;
