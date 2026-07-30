import Base                  from '../../Base';
import AccessSubject         from '../../../models/AccessSubject';
import DX from '../../../models/utils/DX';
import { NotFoundError } from '../../utils/SX';

export default class SwitchReaderGroupsMode extends Base {
    static validationRules = {
        id               : [ 'required', 'db_id' ],
        showReaderGroups : [ 'required', 'boolean' ]
    };

    async execute({ id, showReaderGroups }) {
        try {
            const accessSubject = await AccessSubject.findByPkOrFail(id);

            accessSubject.set({ showReaderGroups });

            await accessSubject.save();

            return {
                data : {
                    showReaderGroups : accessSubject.showReaderGroups
                }
            };
        } catch (e) {
            if (e instanceof DX.NotFoundError) {
                throw new NotFoundError(NotFoundError.codes.CANNOT_FIND_MODEL, {
                    modelName : e.modelName, primaryKey : e.primaryKey
                });
            } else throw e;
        }
    }
}
