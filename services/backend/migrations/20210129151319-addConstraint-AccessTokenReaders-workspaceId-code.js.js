module.exports = {
  up : (queryInterface, DT) => {
    return queryInterface.addConstraint('AccessTokenReaders', {
      type: 'unique',
      fields: ['workspaceId', 'code', 'deletedAt']
    });
  },

  down : (queryInterface) => {
    return queryInterface.removeConstraint('AccessTokenReaders', 'AccessTokenReaders_workspaceId_code_deletedAt_uk');
  }
};
