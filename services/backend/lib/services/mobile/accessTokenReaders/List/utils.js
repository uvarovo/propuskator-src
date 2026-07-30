import unionBy        from 'lodash/unionBy';
// import sortBy        from 'lodash/sortBy';
import AccessSubject from '../../../../models/AccessSubject';
import AccessSetting from '../../../../models/AccessSetting';
import AccessReadersGroup from '../../../../models/AccessReadersGroup';
import AccessTokenReader from '../../../../models/AccessTokenReader';
import sequelize from '../../../../sequelizeSingleton';

async function getPermittedReadersIds({ userId, readersIds = [] }) {
    return sequelize.transaction(async transaction => {
        // accessTokenReadersOrder =  user.accessTokenReadersOrder || [];
        const accessSubject = await AccessSubject.findOne({
            where : { userId }
        });
        // get all enabled cases with list of updated above
        const accessSettings = await AccessSetting.findAll({
            where : {
                enabled               : true,
                isArchived            : false,
                '$accessSubjects.id$' : accessSubject.id
            },
            // eslint-disable-next-line max-len
            // order   : [ [ sequelize.fn('LEAST', sequelize.fn('COALESCE', sequelize.col('`accessTokenReaders->usersAccessTokenReadersOrder`.`position`'), 1), sequelize.fn('COALESCE', sequelize.col('`accessReadersGroups->accessTokenReaders->usersAccessTokenReadersOrder`.`position`'), 1)), 'ASC' ] ],
            include : [
                {
                    association : AccessSetting.AssociationAccessReadersGroups,
                    where       : {
                        enabled    : true,
                        isArchived : false
                    },
                    attributes : [ 'id' ],
                    required   : false,
                    include    : [
                        {
                            where       : _getReaderWhereClause(readersIds),
                            association : AccessReadersGroup.AssociationAccessTokenReaders,
                            // attributes  : [ 'id' ],
                            required    : false,
                            include     : [
                                {
                                    required    : false,
                                    association : AccessTokenReader.AssociationUserAccessTokenReader,
                                    where       : {
                                        userId
                                    }
                                }
                            ]
                        }
                    ]
                },
                {
                    association : AccessSetting.AssociationAccessTokenReaders,
                    where       : _getReaderWhereClause(readersIds),
                    required    : false,
                    include     : [
                        {
                            association : AccessTokenReader.AssociationUserAccessTokenReader,
                            where       : {
                                userId
                            },
                            required : false
                        }
                    ]
                },
                {
                    association : AccessSetting.AssociationAccessSubjects,
                    where       : {
                        enabled    : true,
                        isArchived : false
                    }
                }
            ],
            attributes : [ 'id' ],
            transaction
        });

        const accessTokenReaderIds = unionBy([
            ...accessSettings.map(s => s.accessReadersGroups.map(g => g.accessTokenReaders)).flat().flat(),
            ...accessSettings.map(s => s.accessTokenReaders).flat()
        ], 'id').map(({ id }) => id);

        return accessTokenReaderIds;
    });
}

function _getReaderWhereClause(readersIds) {
    const whereClause = {
        enabled    : true,
        isArchived : false
    };

    if (readersIds.length) whereClause.id = readersIds;

    return whereClause;
}

export default getPermittedReadersIds;
