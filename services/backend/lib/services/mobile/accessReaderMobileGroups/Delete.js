import Base from '../../Base';
import AccessReadersMobileGroup from '../../../models/AccessReadersMobileGroup';
import DX from '../../../models/utils/DX';
import { NotFoundError } from '../../utils/SX';

export default class Delete extends Base {
    static validationRules = {
        id : [ 'required', 'db_id' ]
    };

    async execute({ id }) {
        try {
            const accessReadersMobileGroup = await AccessReadersMobileGroup.findByPkOrFail(id);

            await accessReadersMobileGroup.destroy();

            return {
                id : accessReadersMobileGroup.id
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
