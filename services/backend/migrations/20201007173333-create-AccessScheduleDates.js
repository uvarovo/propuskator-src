module.exports = {
  up : (queryInterface, DT) => {
    return queryInterface.createTable('AccessScheduleDates',
      {
        id                 : { type: DT.BIGINT, primaryKey: true, autoIncrement: true },
        scheduleId         : { type: DT.BIGINT, allowNull: false, references: { model: 'AccessSchedules', key: 'id' } },
        from               : { type: DT.DATE(3), allowNull: true },
        to                 : { type: DT.DATE(3), allowNull: true },
        weekBitMask        : { type: DT.INTEGER.UNSIGNED, allowNull: true },
        monthBitMask       : { type: DT.INTEGER.UNSIGNED, allowNull: true },
        dailyIntervalStart : { type: DT.INTEGER, allowNull: true },
        dailyIntervalEnd   : { type: DT.INTEGER, allowNull: true },
        createdAt          : { type: DT.DATE(3), allowNull: false, defaultValue: DT.literal('CURRENT_TIMESTAMP(3)') }
      },
      {
        charset : 'utf8mb4'
      }
    );
  },

  down : (queryInterface) => {
    return queryInterface.dropTable('AccessScheduleDates');
  }
};
