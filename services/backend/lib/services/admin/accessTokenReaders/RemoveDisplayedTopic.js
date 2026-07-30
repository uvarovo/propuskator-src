import ReaderDisplayedTopic         from '../../../models/ReaderDisplayedTopic.js';
import { NotFoundError }            from '../../utils/SX';
import Base                         from '../../Base.js';
import { dumpReaderDisplayedTopic } from '../../utils/dumps.js';

export default class RemoveDisplayedTopic extends Base {
    static validationRules = {
        accessTokenReaderId : [ 'required', 'db_id' ],
        topic               : [ 'required', 'string' ]
    };

    async execute({ accessTokenReaderId, topic }) {
        const workspaceId = this.cls.get('workspaceId');
        const displayedTopic = await ReaderDisplayedTopic.findOne({
            where : { workspaceId, accessTokenReaderId, topic }
        });

        if (!displayedTopic) {
            throw new NotFoundError(NotFoundError.codes.CANNOT_FIND_MODEL, {
                modelName : ReaderDisplayedTopic.name
            });
        }

        await displayedTopic.destroy();

        const actualDisplayedTopics = await ReaderDisplayedTopic.findAll({
            where : { workspaceId, accessTokenReaderId }
        });

        return {
            data : {
                displayedTopics : actualDisplayedTopics.map(dumpReaderDisplayedTopic)
            }
        };
    }
}
