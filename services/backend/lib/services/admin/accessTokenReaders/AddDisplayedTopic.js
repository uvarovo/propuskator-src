import AccessTokenReader            from '../../../models/AccessTokenReader.js';
import ReaderDisplayedTopic         from '../../../models/ReaderDisplayedTopic.js';
import DX                           from '../../../models/utils/DX';
import { NotFoundError }            from '../../utils/SX';
import Base                         from '../../Base.js';
import { dumpReaderDisplayedTopic } from '../../utils/dumps.js';

export default class AddDisplayedTopic extends Base {
    static validationRules = {
        accessTokenReaderId : [ 'required', 'db_id' ],
        topic               : [ 'required', 'string' ]
    };

    async execute({ accessTokenReaderId, topic }) {
        try {
            // try to find reader in current admin's workspace
            await AccessTokenReader.findByPkOrFail(accessTokenReaderId);

            const workspaceId = this.cls.get('workspaceId');

            await ReaderDisplayedTopic.create({ workspaceId, accessTokenReaderId, topic });

            const actualDisplayedTopics = await ReaderDisplayedTopic.findAll({
                where : { workspaceId, accessTokenReaderId }
            });

            return {
                data : {
                    displayedTopics : actualDisplayedTopics.map(dumpReaderDisplayedTopic)
                }
            };
        } catch (err) {
            if (err instanceof DX.NotFoundError) {
                throw new NotFoundError(NotFoundError.codes.CANNOT_FIND_MODEL, {
                    modelName  : err.modelName,
                    primaryKey : err.primaryKey
                });
            }

            throw err;
        }
    }
}
