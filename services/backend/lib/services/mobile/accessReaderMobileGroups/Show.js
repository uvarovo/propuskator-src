import Base                             from '../../Base';
import AccessReadersMobileGroup         from '../../../models/AccessReadersMobileGroup';
import AccessTokenReader                from '../../../models/AccessTokenReader';
import AccessSubject                    from '../../../models/AccessSubject';
import { dumpAccessReadersMobileGroup } from '../../utils/dumps';
import getPermittedReadersIds           from '../accessTokenReaders/List/utils';
import DX                               from '../../../models/utils/DX';
import { NotFoundError }                from '../../utils/SX';
import sequelize                        from '../../../sequelizeSingleton.js';

export default class Show extends Base {
    static validationRules = {
        id : [ 'required', 'db_id' ]
    };

    async execute({ id }) {
        try {
            const accessReadersMobileGroup = await AccessReadersMobileGroup.findByPkOrFail(id, {
                include : [
                    {
                        association : AccessReadersMobileGroup.AssociationAccessTokenReaders,
                        required    : false
                    }
                ]
            });

            const readersIds = accessReadersMobileGroup.accessTokenReaders.map(r => r.id);
            const permittedReadersIds = readersIds.length ? await getPermittedReadersIds({ userId: this.cls.get('userId'), readersIds }) : [];

            accessReadersMobileGroup.accessTokenReaders = await this._getReaders(
                permittedReadersIds,
                this.cls.get('userId'),
                id
            );

            return {
                data : dumpAccessReadersMobileGroup(accessReadersMobileGroup)
            };
        } catch (e) {
            if (e instanceof DX.NotFoundError) {
                throw new NotFoundError(NotFoundError.codes.CANNOT_FIND_MODEL, {
                    modelName : e.modelName, primaryKey : e.primaryKey
                });
            } else throw e;
        }
    }

    async _getReaders(accessTokenReaderIds, userId, groupId) {
        if (!accessTokenReaderIds.length) return [];

        const accessSubject = await AccessSubject.findOne({ where: { userId } });

        return AccessTokenReader.findAll({
            where : {
                id : accessTokenReaderIds
            },
            attributes : {
                exclude : accessSubject.phoneEnabled ? [] : [ 'phone' ]
            },
            include : [
                {
                    required    : false,
                    association : AccessTokenReader.AssociationUserAccessTokenReader,
                    where       : {
                        userId
                    }
                },
                {
                    association : AccessTokenReader.AssociationAccessCamera,
                    required    : false,
                    where       : {
                        enabled    : true,
                        isArchived : false
                    }
                },
                {
                    association : AccessTokenReader.AssociationUsersGroupAccessTokenReader,
                    required    : false,
                    where       : {
                        userId,
                        accessReadersMobileGroupId : groupId
                    }
                },
                {
                    association : AccessTokenReader.AssociationReaderDisplayedTopic,
                    required    : false
                }
            ],
            order : [
                [ sequelize.literal('- `usersGroupsAccessTokenReaders`.`position`'), 'DESC' ],
                [ 'name', 'ASC' ],
                [ 'id', 'ASC' ]
            ]
        });
    }
}
