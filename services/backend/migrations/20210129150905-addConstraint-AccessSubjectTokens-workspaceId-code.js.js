module.exports = {
  up : (queryInterface, DT) => {
    return queryInterface.addConstraint('AccessSubjectTokens', {
      type: 'unique',
      fields: ['workspaceId', 'code', 'deletedAt']
    });
  },

  down : (queryInterface) => {
    return queryInterface.removeConstraint('AccessSubjectTokens', 'AccessSubjectTokens_workspaceId_code_deletedAt_uk');
  }
};
