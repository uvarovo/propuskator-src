module.exports = {
  up : (queryInterface) => {
      return queryInterface.sequelize.query("INSERT IGNORE INTO `mqtt_acl` (`id`, `allow`, `ipaddr`, `username`, `clientid`, `access`, `topic`) VALUES (1,0,NULL,'$all',NULL,1,'$SYS/#'), (2,0,NULL,'$all',NULL,1,'eq #'), (3,1,'127.0.0.1',NULL,NULL,2,'$SYS/#'), (4,1,NULL,'dashboard',NULL,1,'$SYS/#');");
  },

  down : (queryInterface) => {
      return queryInterface.sequelize.query('DELETE FROM `mqtt_acl` WHERE `id` IN (1,2,3,4);');
  }
};
