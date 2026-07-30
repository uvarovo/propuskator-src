import cors                      from 'cors';
import bodyParser                from 'body-parser';
import multer                    from 'multer';
import useragent                 from 'express-useragent';
import { createProxyMiddleware } from 'http-proxy-middleware';

import cls                from '../cls';
import { initLogger }     from '../extensions/Logger';
import AdminSessionsCheck from '../services/admin/sessions/Check.js';
import AccessCamera       from '../models/AccessCamera.js';
import chista             from './chista.js';

const middlewareLogger = initLogger('Middleware');

export default {
    json : bodyParser.json({ limit  : 1024 * 1024,
        verify : (req, res, buf) => {
            try {
                JSON.parse(buf);
            } catch (e) {
                res.send({
                    status : 0,
                    error  : {
                        code    : 'BROKEN_JSON',
                        message : 'Please, verify your json'
                    }
                });
                throw new Error('BROKEN_JSON');
            }
        }
    }),
    text         : bodyParser.text({ limit: 1024 * 1024 }),
    urlencoded   : bodyParser.urlencoded({ extended: true, limit: 1024 * 1024 }),
    cors         : cors({ origin: '*' }), // We allow any origin because we DO NOT USE cookies and basic auth
    memoryUpload : (req, res, next) => {
        return multer({
            storage : multer.memoryStorage(),
            limits  : { fieldSize: 100 * 1024 * 1024 }
        }).any()(req, res, cls.bind(next, cls.active));
    },
    fileUpload : (req, res, next) => {
        return multer().single('file')(req, res, next);
    },
    cls : (req, res, next) => {
        cls.run(() => next());
    },
    useragent : useragent.express(),

    // Check whether current admin user has permissions to access media for the current camera.
    // Consider that the admin user has permissions if there is at least one camera(even already deleted)
    // with such RTSP URL's hash in the same workspace with admin user.
    async checkPermissionsToBucketCamerasMedia(req, res, next) {
        try {
            const { token } = req.query;
            const { rtspUrlHash } = req.params;

            const { adminUser } = await chista.runService(AdminSessionsCheck, { params: { token } });
            const workspaceCameras = await AccessCamera.findAll({
                where    : { workspaceId: adminUser.workspaceId },
                paranoid : false
            });
            const targetCamera = workspaceCameras.find(camera => camera.getRtspUrlHash() === rtspUrlHash);

            // Case when there are no cameras with such RTSP URL's hash in current workspace
            if (!targetCamera) {
                throw new Error(
                    `there is no camera with such assigned RTSP URL in workspace with ID "${adminUser.workspaceId}"`
                );
            }

            return next();
        } catch (err) {
            middlewareLogger.warn('checkPermissionsToBucketCamerasMedia', err);

            return res.sendStatus(403);
        }
    },

    createProxyMiddleware(options = {}) {
        return createProxyMiddleware({
            logLevel     : 'silent',
            changeOrigin : true,
            onProxyReq   : proxyReq => {
                try {
                    proxyReq.removeHeader('authorization');
                } catch (e) {
                    middlewareLogger.warn('createProxyMiddleware', e);
                }
            },
            ...options
        });
    }
};
