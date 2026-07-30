import { URL, URLSearchParams } from 'url';

import qrcode from 'qrcode';

import Base                     from '../../Base';
import config                   from '../../../config.js';
import * as deepLinkConstants   from '../../../constants/deepLinks.js';
import Workspace                from '../../../models/Workspace';
import { dumpAccessAPISetting } from '../../utils/dumps';
import DX                       from '../../../models/utils/DX';

export default class APISettingShow extends Base {
    validate() {}
    async execute() {
        try {
            const workspace = await Workspace.findByPkOrFail(this.cls.get('workspaceId'));
            // Deep link to open mobile app for creating request for subject registration in the workspace
            const requestSubjectRegistrationDeepLinkUrlObj = new URL(config.deepLinkHostURL);

            requestSubjectRegistrationDeepLinkUrlObj.pathname += `/${deepLinkConstants.ROUTES.REQUEST}`;
            requestSubjectRegistrationDeepLinkUrlObj.search = new URLSearchParams({
                workspaceName : workspace.name,
                apiURL        : config.apiURL
            });

            const requestSubjectRegistrationDeepLinkUrl = requestSubjectRegistrationDeepLinkUrlObj.toString();
            // Base64 encoded png image of QR code
            const requestSubjectRegistrationQrCode = await qrcode.toDataURL(
                requestSubjectRegistrationDeepLinkUrl,
                { errorCorrectionLevel: config.qrCodes.errorCorrectionLevel }
            );

            return {
                data : dumpAccessAPISetting(workspace, {
                    requestSubjectRegistration : {
                        deepLinkUrl : requestSubjectRegistrationDeepLinkUrl,
                        qrCode      : requestSubjectRegistrationQrCode
                    }
                })
            };
        } catch (e) {
            if (e instanceof DX) {// holly shield
                throw e;
            } else throw e;
        }
    }
}
