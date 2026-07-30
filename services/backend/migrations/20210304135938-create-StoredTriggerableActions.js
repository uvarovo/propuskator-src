const TABLE_NAME = 'StoredTriggerableActions';
const TYPES      = {
    RESET_USER_PASSWORD  : 'RESET_USER_PASSWORD',
    RESET_ADMIN_PASSWORD : 'RESET_ADMIN_PASSWORD'
};

module.exports = {
    up : (queryInterface, Sequelize) => {
        return queryInterface.createTable(TABLE_NAME, {
            id          : { type: Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true  },
            userId      : {
                type       : Sequelize.BIGINT,
                allowNull  : true,
                references : {
                    model    : 'Users',
                    key      : 'id',
                    onDelete : 'CASCADE'
                }
            },
            adminUserId : {
                type       : Sequelize.BIGINT,
                allowNull  : true,
                references : {
                    model    : 'AdminUsers',
                    key      : 'id',
                    onDelete : 'CASCADE'
                }
            },
            type      : { type: Sequelize.ENUM(Object.values(TYPES)), allowNull: false },
            payload   : { type: Sequelize.JSON, allowNull: false },
            createdAt : {
                type         : Sequelize.DATE(3),
                allowNull    : false,
                defaultValue : Sequelize.literal('CURRENT_TIMESTAMP(3)')
            },
            deletedAt : {
                type         : Sequelize.DATE(3),
                allowNull    : true
            }
        });
    },
    down : (queryInterface) => {
        return queryInterface.dropTable(TABLE_NAME);
    }
};
