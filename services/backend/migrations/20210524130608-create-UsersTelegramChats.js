const TABLE_NAME = 'users_telegram_chats';

// create intermediate table to have opportunity to implement many-to-many relation
// for mobile users and Telegram chats in the future
module.exports = {
    up : (queryInterface, Sequelize) => {
        return queryInterface.createTable(TABLE_NAME, {
            userId : {
                type       : Sequelize.BIGINT,
                primaryKey : true,
                allowNull  : false,
                references : {
                    model    : 'users',
                    key      : 'id',
                    onDelete : 'CASCADE'
                }
            },
            chatId    : { type: Sequelize.BIGINT.UNSIGNED, primaryKey: true, allowNull: false },
            createdAt : {
                type         : Sequelize.DATE(3),
                allowNull    : false,
                defaultValue : Sequelize.literal('CURRENT_TIMESTAMP(3)')
            },
            updatedAt : {
                type         : Sequelize.DATE(3),
                allowNull    : false,
                defaultValue : Sequelize.literal('CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)')
            }
        });
    },

    down : (queryInterface) => {
        return queryInterface.dropTable(TABLE_NAME);
    }
};
