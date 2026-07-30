import Base        from '../../../Base';
import AccessTokenReader from '../../../../models/AccessTokenReader';
import AccessSubject from '../../../../models/AccessSubject';
import sequelize from '../../../../sequelizeSingleton';
import {
    dumpAccessTokenReader
} from '../../../utils/dumps';
import DX from '../../../../models/utils/DX';
import getPermittedReadersIds from './utils';

export default class AccessTokenReaderList extends Base {
    static validationRules = {};

    async execute() {
        const userId = this.cls.get('userId');
        const accessSubject = await AccessSubject.findOne({
            where : { userId }
        });

        if (!userId) throw new Error('Bad request');

        try {
            const accessTokenReaderIds = await getPermittedReadersIds({ userId });

            const accessTokenReaders = await AccessTokenReader.findAll({
                where : {
                    id : accessTokenReaderIds
                },
                attributes : {
                    exclude : accessSubject.phoneEnabled ? [] : [ 'phone' ]
                },
                order   : [ [ sequelize.literal('- `userAccessTokenReader`.`position`'), 'DESC' ], [ 'name', 'ASC' ], [ 'id', 'ASC' ] ],
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
                        association : AccessTokenReader.AssociationReaderDisplayedTopic,
                        required    : false
                    }
                ]
            });
                // const mapOrder = Object.fromEntries(
                //     Object.entries(accessTokenReadersOrder).map(([ k, v ]) => [ v, k ])
                // );

            // accessTokenReaders = sortBy(accessTokenReaders, ({ id }) => parseInt(mapOrder[id], 10));

            return {
                data : accessTokenReaders.map(dumpAccessTokenReader)// ,
                // meta : { accessTokenReadersOrder }
            };
        } catch (e) {
            if (e instanceof DX) {// holly shield
                throw e;
            } else throw e;
        }
    }
}
