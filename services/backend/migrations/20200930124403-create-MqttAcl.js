module.exports = {
  up : (queryInterface, DT) => {
      return queryInterface.createTable('mqtt_acl', {
            id        : { type: DT.BIGINT, primaryKey: true, autoIncrement: true },
            allow     : { type: DT.INTEGER(1), defaultValue: null, comment: '0: deny, 1: allow' },
            ipaddr    : { type: DT.STRING, defaultValue: null },
            username  : { type: DT.STRING, defaultValue: null, allowNull: true, index: true },
            clientid  : { type: DT.STRING, defaultValue: null },
            access    : { type: DT.INTEGER(2), allowNull: false, comment: '1: subscribe, 2: publish, 3: pubsub' },
            topic     : { type: DT.STRING, defaultValue: '', allowNull: false },
            createdAt : { type: DT.DATE(3), defaultValue: DT.literal('CURRENT_TIMESTAMP(3)') },
            updatedAt : { type: DT.DATE(3), defaultValue: DT.literal('CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)') }
      });
  },

  down : (queryInterface) => {
      return queryInterface.dropTable('mqtt_acl');
  }
};
