import express          from 'express';
import controllers      from '../controllers/servicesApi';

const router = express.Router();

const checkSession = controllers.sessions.check;

// create session
router.post('/login', controllers.sessions.create);

router.use(checkSession);

// Access token readers (used by modbus bridge)
router.post('/access-token-readers/bulk-create', controllers.accessTokenReaders.bulkCreate);

export default router;
