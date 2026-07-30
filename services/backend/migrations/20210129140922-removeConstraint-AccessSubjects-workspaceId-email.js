module.exports = {
  up : (queryInterface, DT) => {
    return queryInterface.removeConstraint('AccessSubjects', 'AccessSubjects_workspaceId_email_uk');
  },

  down : (queryInterface) => {
    return queryInterface.addConstraint('AccessSubjects', {
      type: 'unique',
      fields: ['workspaceId', 'email']
    });
  }
};
