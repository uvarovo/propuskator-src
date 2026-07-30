/* eslint-disable camelcase */
import Base from '../../Base';
import User from '../../../models/User';
import AccessSubject from '../../../models/AccessSubject';
import Notification from '../../../models/Notification';
import { NotFoundError } from '../../utils/SX';
import sequelize from '../../../sequelizeSingleton';
import DX from '../../../models/utils/DX';

export default class UserDelete extends Base {
    static validationRules = {}

    async execute() {
        try {
            const userId = this.cls.get('userId');

            let user = null;

            await sequelize.transaction(async transaction => {
                user = await User.findByPkOrFail(userId, { transaction });

                await user.destroy({ transaction });

                const accessSubject = await AccessSubject.findOne({ where: { userId: user.id } });

                await this._sendNotification(accessSubject, transaction);
            });

            return {
                data : { id: user.id }
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

    async _sendNotification(accessSubject, transaction) {
        return Notification.create({
            type            : Notification.types.USER_ACTIONS.DELETED_SUBJECT_PROFILE,
            message         : `Субъект ${accessSubject.name} удалил свой профиль`,
            accessSubjectId : accessSubject.id
        }, { transaction });
    }
}
