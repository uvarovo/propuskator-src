import Base from '../../Base';
import Workspace from '../../../models/Workspace';
import { dumpWorkspaceSettings } from '../../utils/dumps';

export default class ShowWorkspaceSettings extends Base {
    static validationRules = {};

    async execute({}) {
        const workspaceId = this.cls.get('workspaceId');

        const workspace = await Workspace.findOne({ where: { id: workspaceId } });

        return {
            data : dumpWorkspaceSettings({
                ...workspace.dataValues,
                notificationTypes : Workspace.notificationTypesToArray(workspace.notificationTypes)
            })
        };
    }
}
