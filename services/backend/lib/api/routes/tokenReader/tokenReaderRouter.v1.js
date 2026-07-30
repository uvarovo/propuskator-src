import express          from 'express';
import controllers      from '../../controllers/tokenReader/v1';

const router = express.Router();

const checkSession = controllers.sessions.check;

router.use(checkSession);

router.post('/access-tokens/sync', controllers.accessTokens.sync);

router.post('/access-logs', controllers.accessLogs.save);

router.get('/time', controllers.time.show);

export default router;
