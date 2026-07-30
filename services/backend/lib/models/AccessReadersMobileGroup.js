/* eslint-disable no-param-reassign */
import { DataTypes as DT, Op  } from 'sequelize';
import sequelize from '../sequelizeSingleton';
import Base from './Base';
import AccessTokenReader from './AccessTokenReader';
import MobileGroupToReaderMap from './mappings/MobileGroupToReaderMap';

class AccessReadersMobileGroup extends Base {
    static initRelations() {
        this.AssociationAccessTokenReaders = this.belongsToMany(AccessTokenReader, { through: MobileGroupToReaderMap, as: 'accessTokenReaders', foreignKey: 'groupId', otherKey: 'accessTokenReaderId' });
        this.AssociationMobileGroupToReaderMap = this.hasMany(MobileGroupToReaderMap, { as: 'mobileGroupToReaderMap', foreignKey: 'groupId' });
    }

    static async findAllByParams({ search, limit, offset, sortedBy, order, accessSubjectId }, options = {}) {
        const filterScopes = [
            { method: [ 'search', search ] }
        ];

        const { rows, count } = await AccessReadersMobileGroup.scope(filterScopes).findAndCountAll({
            where : {
                accessSubjectId
            },
            ...options,
            ...{ limit, offset },
            attributes : [ 'id' ],
            order      : [ [ sortedBy, order ], [ 'id', 'ASC' ] ],
            subQuery   : false
        });

        const accessReadersMobileGroups = rows.length ? await AccessReadersMobileGroup.findAll({
            where : {
                id : rows.map(({ id }) => id)
            },
            order : [ [ sortedBy, order ], [ 'id', 'ASC' ] ]
        }) : [];

        return { accessReadersMobileGroups, count: count || 0 };
    }
}
AccessReadersMobileGroup.init({
    id              : { type: DT.BIGINT, primaryKey: true, autoIncrement: true },
    name            : { type: DT.STRING, allowNull: false },
    logoType        : { type: DT.STRING, allowNull: true },
    logoColor       : { type: DT.STRING, allowNull: false, defaultValue: '#DFDFDF' },
    accessSubjectId : { type: DT.STRING, allowNull: false },
    createdAt       : { type: DT.DATE(3) },
    updatedAt       : { type: DT.DATE(3) }
}, {
    tableName  : 'AccessReadersMobileGroups',
    timestamps : true,
    scopes     : {
        search(search) {
            if (search) {
                return {
                    where : {
                        [Op.or] : [
                            {
                                name : {
                                    [Op.like] : `%${search}%`
                                }
                            }
                        ]
                    }
                };
            }

            return {};
        }
    },
    sequelize
});

export default AccessReadersMobileGroup;
