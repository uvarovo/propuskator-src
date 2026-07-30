module.exports = {
  up : (queryInterface, DT) => {
      return queryInterface.createTable('mqtt_user', {
          id           : { type: DT.BIGINT, primaryKey: true, autoIncrement: true },
          username     : { type: DT.STRING, allowNull: false, unique: true },
          password     : { type: DT.STRING, allowNull: false },
          salt         : { type: DT.STRING, defaultValue: null },
          is_superuser : { type: DT.TINYINT, allowNull: false, defaultValue: 0 },
          createdAt    : { type: DT.DATE(3), defaultValue: DT.literal('CURRENT_TIMESTAMP(3)') },
          updatedAt    : { type: DT.DATE(3), defaultValue: DT.literal('CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)') }
      });
  },

  down : (queryInterface) => {
      return queryInterface.dropTable('mqtt_user');
  }
};
