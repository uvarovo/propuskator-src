module.exports = {
  up : (queryInterface, DT) => {
    return queryInterface.addConstraint('AccessSubjects', {
      type: 'unique',
      fields: ['workspaceId', 'email', 'deletedAt']
    });
  },

  down : (queryInterface) => {
    return queryInterface.removeConstraint('AccessSubjects', 'AccessSubjects_workspaceId_email_deletedAt_uk');
  }
};
