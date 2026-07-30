import Base               from '../../../Base';
import { tokenReadersManager }   from '../../../../managers/tokenReadersManager';
import AccessTokenReader   from '../../../../models/AccessTokenReader';
import Workspace   from '../../../../models/Workspace';
import { ForbiddenError } from '../../../utils/SX';
import cls              from '../../../../cls';


export default class SessionsCheck extends Base {
    static validationRules = {
        code  : [ 'required', 'string' ],
        token : [ 'required', 'string' ]
    };

    async execute({ code, token }) {
        try {
            const workspace = await Workspace.findOne({ where: { accessToken: token } });

            let accessTokenReader = null;

            if (workspace) {
                cls.set('workspaceId', workspace.id);

                accessTokenReader = await AccessTokenReader.findOne({
                    where : { code }
                });
            }

            if (workspace && !accessTokenReader) {
                await tokenReadersManager.handleUnknownAccessTokenReaderPing(code);
            }
            if (!workspace || !accessTokenReader) throw new ForbiddenError(ForbiddenError.codes.ACCESS_FORBIDDEN);

            await tokenReadersManager.handleAccessTokenReaderPing(accessTokenReader);

            return {
                tokenReaderId       : accessTokenReader.id,
                tokenReaderActiveAt : accessTokenReader.activeAt,
                accessTokenReader
            };
        } catch (e) {
            throw e;
        }
    }
}
