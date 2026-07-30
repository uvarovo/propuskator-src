import Base from '../../Base';
import AccessSubjectToken from '../../../models/AccessSubjectToken';
import sequelize from '../../../sequelizeSingleton';
import Notification from '../../../models/Notification';
import DX from '../../../models/utils/DX';
import { NotFoundError, BadRequestError } from '../../utils/SX';

export default class AccessSubjectTokenEnable extends Base {
    static validationRules = {
        id : [ 'required', 'db_id' ]
    };

    async execute({ id }) {
        try {
            const accessSubjectToken = await AccessSubjectToken.findByPkOrFail(id);

            await sequelize.transaction(async transaction => {
                await accessSubjectToken.update({ enabled: true, updatedAt: sequelize.fn('CURRENT_TIMESTAMP', 3) }, { transaction });
                await accessSubjectToken.updateReaderTokens({ transaction });

                await Notification.create({
                    message              : 'Subject has enabled token',
                    type                 : Notification.types.USER_ACTIONS.SUBJECT_ENABLED_TOKEN,
                    accessSubjectTokenId : accessSubjectToken.id,
                    accessSubjectId      : accessSubjectToken.accessSubjectId
                }, {
                    transaction
                });
            });

            return {
                data : { enabled: true }
            };
        } catch (e) {
            if (e instanceof DX) {
                if (e instanceof DX.ForeignKeyConstraintError) {
                    throw new BadRequestError(BadRequestError.codes.FOREIGN_KEY_CONSTRAINT, {
                        fields : e.fields, modelName : e.modelName
                    });
                } else if (e instanceof DX.NotFoundError) {
                    throw new NotFoundError(NotFoundError.codes.CANNOT_FIND_MODEL, {
                        modelName : e.modelName, primaryKey : e.primaryKey
                    });
                } else throw e;
            } else throw e;
        }
    }
}
