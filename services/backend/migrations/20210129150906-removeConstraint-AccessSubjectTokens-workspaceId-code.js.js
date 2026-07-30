module.exports = {
  up : (queryInterface, DT) => {
    return queryInterface.removeConstraint('AccessSubjectTokens', 'AccessSubjectTokens_workspaceId_code_uk');
  },

  down : (queryInterface) => {
    return queryInterface.addConstraint('AccessSubjectTokens', {
      type: 'unique',
      fields: ['workspaceId', 'code']
    });
  }
};
