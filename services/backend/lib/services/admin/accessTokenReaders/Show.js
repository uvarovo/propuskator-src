import Base              from '../../Base';
import AccessTokenReader       from '../../../models/AccessTokenReader';
import {
    dumpAccessTokenReader
} from '../../utils/dumps';
import DX from '../../../models/utils/DX';
import { NotFoundError } from '../../utils/SX';

export default class AccessTokenReaderShow extends Base {
    static validationRules = {
        id : [ 'required', 'db_id' ]
    };

    async execute({ id }) {
        try {
            const accessTokenReader = await AccessTokenReader.findByPkOrFail(id, {
                include : [
                    {
                        association : AccessTokenReader.AssociationAccessReadersGroups,
                        required    : false
                    }
                ]
            });

            return {
                data : dumpAccessTokenReader(accessTokenReader)
            };
        } catch (e) {
            if (e instanceof DX) {// holly shield
                if (e instanceof DX.NotFoundError) {
                    throw new NotFoundError(NotFoundError.codes.CANNOT_FIND_MODEL, {
                        modelName : e.modelName, primaryKey : e.primaryKey
                    });
                } else throw e;
            } else throw e;
        }
    }
}
