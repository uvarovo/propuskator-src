const ACTION_TYPES = {
    // IMPORTANT: temporary solution to solve the problem that current version of
    // token reader firmware doesn't add new rules if them are not present in list
    // for deleting.
    // Example:
    // If we want to add new rules for codes "CODE", "CODE2" in realization when ADD_ACCESS: 'ADD_ACCESS'
    // the response will be like(rules are present only in list for adding):
    // 27223968%%
    // CODE_/3_1_2_0001111
    // CODE2_/3_1_2_0001111
    // But in current version of token reader firmware it only adds all rules from list for adding when them present
    // in list for deleting:
    // 27223968%CODE,CODE2%
    // CODE_/3_1_2_0001111
    // CODE2_/3_1_2_0001111
    ADD_ACCESS    : 'UPDATE_ACCESS',
    UPDATE_ACCESS : 'UPDATE_ACCESS',
    REMOVE_ACCESS : 'REMOVE_ACCESS'
};

export {
    ACTION_TYPES
};
