module.exports = {
  up : (queryInterface, DT) => {
    return queryInterface.removeConstraint('AccessTokenReaders', 'AccessTokenReaders_workspaceId_code_uk');
  },

  down : (queryInterface) => {
    return queryInterface.addConstraint('AccessTokenReaders', {
      type: 'unique',
      fields: ['workspaceId', 'code']
    });
  }
};
