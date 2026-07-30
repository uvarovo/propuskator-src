import express          from 'express';
import controllers      from '../controllers/mobile';
import { memoryUpload } from '../middlewares';

const router = express.Router();

const checkSession = controllers.sessions.check;

// router.use((req, res, next) => {
//     // eslint-disable-next-line no-param-reassign
//     req.disableTranslate = true;

//     return next();
// });

router.post('/register', controllers.users.register);
// Sessions
router.post('/login', controllers.sessions.create);

router.post('/requestPasswordReset', controllers.users.requestPasswordReset);
router.post('/validatePasswordResetCode', controllers.users.validatePasswordResetCode);
router.post('/passwordReset', controllers.users.passwordReset);
router.post('/createRegistrationRequest', controllers.users.createRegistrationRequest);

// References
router.get('/references',       controllers.references.show);
router.get('/references/:name', controllers.references.show);

router.use(checkSession);

// Access token readers
router.get('/access-token-readers', controllers.accessTokenReaders.list);
router.post('/access-token-readers/:id/open', controllers.accessTokenReaders.open);

// Users access token readers
router.post('/access-token-readers/saveOrder', controllers.usersAccessTokenReaders.saveOrder);
router.put('/access-token-readers', controllers.usersAccessTokenReaders.updateOrCreate);

// Users groups access token readers
router.post('/access-token-readers/group/:groupId/saveOrder', controllers.usersGroupsAccessTokenReaders.saveOrder);

// Access reader mobile gropus
router.post('/access-reader-groups',              controllers.accessReaderGroups.create);
router.get('/access-reader-groups/logos',         controllers.accessReaderGroups.listLogos);
router.get('/access-reader-groups/:id',           controllers.accessReaderGroups.show);
router.get('/access-reader-groups',               controllers.accessReaderGroups.list);
router.patch('/access-reader-groups/:id',         controllers.accessReaderGroups.update);
router.delete('/access-reader-groups/:id',        controllers.accessReaderGroups.delete);

// Access subjects
router.get('/access-subject-tokens', controllers.accessSubjectTokens.list);
router.post('/access-subject-tokens/attach/id', controllers.accessSubjectTokens.attachWithId);
router.post('/access-subject-tokens/attach', controllers.accessSubjectTokens.attachWithName);

router.post('/access-subject-tokens/:id/detach', controllers.accessSubjectTokens.detach);
router.post('/access-subject-tokens/:id/enable', controllers.accessSubjectTokens.enable);
router.post('/access-subject-tokens/:id/disable', controllers.accessSubjectTokens.disable);

router.patch('/profile', memoryUpload, controllers.users.update);
router.delete('/profile', controllers.users.delete);
router.get('/profile',   controllers.users.show);
router.get('/mqttCredentials',   controllers.users.mqttCredentials);

// Access subject
router.get('/access-subject', controllers.accessSubjects.show);
router.patch('/access-subject/reader-groups/:id', controllers.accessSubjects.switchReaderGroupsMode);

// Reported Issues
router.post('/reported-issues', controllers.reportedIssues.create);

export default router;
