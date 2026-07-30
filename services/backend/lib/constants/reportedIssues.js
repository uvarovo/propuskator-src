const STATUSES = {
    PENDING : 'pending',
    SENDING : 'sending',
    SENT    : 'sent'
};

const ADMIN_ISSUE_TYPES = {
    WEB_APP : 'web_app'
};

const USER_ISSUE_TYPES = {
    MOBILE_APP : 'mobile_app'
};

const TYPES = {
    ...ADMIN_ISSUE_TYPES,
    ...USER_ISSUE_TYPES
};

export default {
    STATUSES,
    TYPES,
    ADMIN_ISSUE_TYPES,
    USER_ISSUE_TYPES
};
