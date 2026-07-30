/* eslint-disable func-style */
/* eslint-disable prefer-const */
import Base        from '../../Base';
import AccessTokenReader from '../../../models/AccessTokenReader';
import DX from '../../../models/utils/DX';
import { TimeoutError, NotFoundError, OpenDoorError } from '../../utils/SX';

export default class AccessTokenReaderOpen extends Base {
    static validationRules = {
        id : [ 'required', 'db_id' ]
    };

    async execute({ id }) {
        try {
            const accessTokenReader = await AccessTokenReader.findByPkOrFail(id);

            await accessTokenReader.open();

            return {};
        } catch (e) {
            if (e instanceof DX) {
                if (e instanceof DX.NotFoundError) {
                    throw new NotFoundError(NotFoundError.codes.CANNOT_FIND_MODEL, {
                        modelName : e.modelName, primaryKey : e.primaryKey
                    });
                } else if (e instanceof DX.TimeoutError) {
                    throw new TimeoutError();
                } else if (e instanceof DX.OpenDoorError) {
                    throw new OpenDoorError();
                } else throw e;
            } else throw e;
        }
    }
}
