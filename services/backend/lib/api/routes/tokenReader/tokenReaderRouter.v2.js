import express          from 'express';
import controllersv1      from '../../controllers/tokenReader/v1';
import controllers      from '../../controllers/tokenReader/v2';

const router = express.Router();

const checkSession = controllersv1.sessions.check;

router.use(checkSession);

router.get('/time', controllers.time.show);

export default router;
