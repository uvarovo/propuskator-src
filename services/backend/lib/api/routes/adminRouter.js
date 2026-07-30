import express          from 'express';
import controllers      from '../controllers/admin';
import { memoryUpload, fileUpload } from '../middlewares';

const router = express.Router();

const checkSession = controllers.sessions.check;

router.post('/register', controllers.adminUsers.register);
// Sessions
router.post('/login', controllers.sessions.create);

router.post('/requestPasswordReset', controllers.adminUsers.requestPasswordReset);
router.post('/passwordReset', controllers.adminUsers.passwordReset);

// References
router.get('/references',       controllers.references.show);
router.get('/references/:name', controllers.references.show);

router.use(checkSession);

router.get('/workspace/settings', controllers.workspaceSettings.show);
router.patch('/workspace/settings', controllers.workspaceSettings.update);

// Cameras
router.post('/access-cameras',      controllers.accessCameras.create);
router.get('/access-cameras',       controllers.accessCameras.list);
router.get('/access-cameras/:id',   controllers.accessCameras.show);
router.patch('/access-cameras/:id', controllers.accessCameras.update); // !!! put-patch
router.delete('/access-cameras/:id', controllers.accessCameras.delete); // !!! put-patch

// Subjects
router.post('/access-subjects',      memoryUpload, controllers.accessSubjects.create);
router.post('/access-subjects/invite/:id', controllers.accessSubjects.invite);
router.get('/access-subjects',       controllers.accessSubjects.list);
router.get('/access-subjects/export/csv', controllers.accessSubjects.exportCsv);
router.get('/access-subjects/:id',   controllers.accessSubjects.show);
router.put('/access-subjects/:id',   memoryUpload, controllers.accessSubjects.update); // !!! put-patch
router.patch('/access-subjects/:id', memoryUpload, controllers.accessSubjects.update); // !!! put-patch
router.delete('/access-subjects/:id', memoryUpload, controllers.accessSubjects.delete); // !!! put-patch
router.post('/access-subjects/createOnRequest', memoryUpload, controllers.accessSubjects.createOnRequest);

// Subject tokens
router.post('/access-subject-tokens', controllers.accessSubjectTokens.create);
router.post('/access-subject-tokens/bulk-create', controllers.accessSubjectTokens.bulkCreate);
router.get('/access-subject-tokens/:id',   controllers.accessSubjectTokens.show);
router.get('/access-subject-tokens/export/csv', controllers.accessSubjectTokens.exportCsv);
router.get('/access-subject-tokens',       controllers.accessSubjectTokens.list);
router.patch('/access-subject-tokens/:id', controllers.accessSubjectTokens.update);
router.delete('/access-subject-tokens/:id', controllers.accessSubjectTokens.delete);

// Schedules
router.post('/access-schedules',      controllers.accessSchedules.create);
router.get('/access-schedules',       controllers.accessSchedules.list);
router.get('/access-schedules/:id',   controllers.accessSchedules.show);
router.patch('/access-schedules/:id', controllers.accessSchedules.update);
router.delete('/access-schedules/:id', controllers.accessSchedules.delete);

// Access reader gropus
router.post('/access-reader-groups',       controllers.accessReaderGroups.create);
router.get('/access-reader-groups/:id',    controllers.accessReaderGroups.show);
router.get('/access-reader-groups',        controllers.accessReaderGroups.list);
router.patch('/access-reader-groups/:id',  controllers.accessReaderGroups.update);
router.delete('/access-reader-groups/:id', controllers.accessReaderGroups.delete);

// Access token readers
router.post('/access-token-readers',      controllers.accessTokenReaders.create);
router.get('/access-token-readers',       controllers.accessTokenReaders.list);
router.get('/access-token-readers/connection-statuses', controllers.accessTokenReaders.listConnectionStatuses);
router.get('/access-token-readers/phone-numbers', controllers.accessTokenReaders.listPhoneNumbers);
router.get('/access-token-readers/:id',   controllers.accessTokenReaders.show);
router.patch('/access-token-readers/:id', controllers.accessTokenReaders.update);
router.delete('/access-token-readers/:id', controllers.accessTokenReaders.delete);
router.post('/access-token-readers/:id/open', controllers.accessTokenReaders.open);
router.post('/access-token-readers/add-displayed-topic', controllers.accessTokenReaders.addDisplayedTopic);
router.post('/access-token-readers/remove-displayed-topic', controllers.accessTokenReaders.removeDisplayedTopic);

// Access settings
router.post('/access-settings',      controllers.accessSettings.create);
router.get('/access-settings',       controllers.accessSettings.list);
router.get('/access-settings/:id',   controllers.accessSettings.show);
router.put('/access-settings/:id',   controllers.accessSettings.update); // !!! put-patch
router.patch('/access-settings/:id', controllers.accessSettings.update); // !!! put-patch
router.delete('/access-settings/:id',   controllers.accessSettings.delete); // !!! put-patch

// Access logs
router.get('/access-logs', controllers.accessLogs.list);
// router.get('/access-logs/csv', controllers.accessLogs.listCSV);

// Admin users
router.patch('/profile', memoryUpload, controllers.adminUsers.update);
router.get('/profile',   controllers.adminUsers.show);
router.get('/mqttCredentials',   controllers.adminUsers.mqttCredentials);

// API settings
router.patch('/access-api-settings/refresh', controllers.accessAPISettings.refresh);
router.get('/access-api-settings',   controllers.accessAPISettings.show);

// Notifications
router.get('/notifications', controllers.notifications.list);
router.patch('/notifications/activate', controllers.notifications.activate);
router.patch('/notifications/deactivate', controllers.notifications.deactivate);
router.post('/notifications/readAll', controllers.notifications.readAll);

// Reported Issues
router.post('/reported-issues', controllers.reportedIssues.create);

// utils
router.post('/utils/csv-to-json', fileUpload, controllers.utilsController.csvToJson);

export default router;
