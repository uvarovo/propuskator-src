import { nanoid } from 'nanoid';
import Base                     from '../../Base';
import Workspace         from '../../../models/Workspace';
import { dumpAccessAPISetting } from '../../utils/dumps';
import { apiTokenLength } from '../../../config';
import DX from '../../../models/utils/DX';


export default class APISettingRefresh extends Base {
    validate() {}
    async execute() {
        try {
            const workspace = await Workspace.findByPkOrFail(this.cls.get('workspaceId'));

            await workspace.update({
                accessToken : nanoid(apiTokenLength)
            });

            return {
                data : dumpAccessAPISetting(workspace)
            };
        } catch (e) {
            if (e instanceof DX) {// holly shield
                throw e;
            } else throw e;
        }
    }
}
