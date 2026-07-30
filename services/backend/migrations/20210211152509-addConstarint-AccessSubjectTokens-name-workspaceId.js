module.exports = {
  up : (queryInterface, DT) => {
    return queryInterface.addConstraint('AccessSubjectTokens', {
      type: 'unique',
      fields: ['workspaceId', 'name', 'deletedAt']
    });
  },

  down : (queryInterface) => {
    return queryInterface.removeConstraint('AccessSubjectTokens', 'AccessSubjectTokens_workspaceId_name_deletedAt_uk');
  }
};
