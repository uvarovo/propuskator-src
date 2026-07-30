import Base                                from '../../Base';
import AccessSubject                       from '../../../models/AccessSubject';
import Workspace                           from '../../../models/Workspace';
import DX                                  from '../../../models/utils/DX';
import { dumpAccessSubject }               from '../../utils/dumps';
import { NotFoundError, ValidationError }  from '../../utils/SX';
import sendInvitationEmail                 from './utils/sendInvitationEmail';

export default class AccessSubjectInvite extends Base {
    static validationRules = {
        id : [ 'required', 'db_id' ]
    };

    async execute({ id }) {
        try {
            const accessSubject = await AccessSubject.findByPkOrFail(id);

            if (!accessSubject.mobileEnabled) {
                throw new ValidationError(ValidationError.codes.SUBJECT_NOT_PERMITTED_TO_USE_APP);
            }

            const { workspaceId, email } = accessSubject;

            const workspace = await Workspace.findOne({ where: { id: workspaceId } });

            await sendInvitationEmail({ email, workspace });

            await accessSubject.update({ isInvited: true });

            return {
                data : dumpAccessSubject(accessSubject)
            };
        } catch (e) {
            if (e instanceof DX) {
                if (e instanceof DX.NotFoundError) {
                    throw new NotFoundError(NotFoundError.codes.CANNOT_FIND_MODEL, {
                        modelName : e.modelName, primaryKey : e.primaryKey
                    });
                } else throw e;
            } else throw e;
        }
    }
}
