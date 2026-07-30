const configurableTypes = {
    USER_ACTIONS : {
        ACCESS_SUBJECT_REGISTRATION : 'ACCESS_SUBJECT_REGISTRATION',
        DELETED_SUBJECT_PROFILE     : 'DELETED_SUBJECT_PROFILE',
        SUBJECT_ATTACHED_TOKEN      : 'SUBJECT_ATTACHED_TOKEN',
        SUBJECT_ENABLED_TOKEN       : 'SUBJECT_ENABLED_TOKEN',
        SUBJECT_DISABLED_TOKEN      : 'SUBJECT_DISABLED_TOKEN',
        SUBJECT_DETACHED_TOKEN      : 'SUBJECT_DETACHED_TOKEN'
    },
    READER_STATE : {
        ACTIVE_READER   : 'ACTIVE_READER',
        INACTIVE_READER : 'INACTIVE_READER'
    },
    ACCESS_ATTEMPTS : {
        UNAUTH_SUBJECT_ACCESS      : 'UNAUTH_SUBJECT_ACCESS',
        UNAUTH_SUBJECT_PHN_ACCESS  : 'UNAUTH_SUBJECT_PHN_ACCESS',
        UNAUTH_ACCESS              : 'UNAUTH_ACCESS',
        UNAUTH_BUTTON_ACCESS       : 'UNAUTH_BUTTON_ACCESS',
        SECURITY_SYSTEM_ACCESS_ON  : 'SECURITY_SYSTEM_ACCESS_ON', // warning type, is used for authorized attempts to show warning message
        SECURITY_SYSTEM_ACCESS_OFF : 'SECURITY_SYSTEM_ACCESS_OFF'
    }
};

const alwaysEnabledTypes = {
    NEW_READER                : 'NEW_READER',
    UNKNOWN_TOKEN             : 'UNKNOWN_TOKEN',
    USER_REQUEST_REGISTRATION : 'USER_REQUEST_REGISTRATION'
};

const referencesTypes = [
    {
        name  : 'USER_ACTIONS',
        label : {
            ru : 'Действия пользователей мобильного приложения',
            en : 'User actions in the mobile application',
            uk : 'Дії користувачів у мобільному додатку'
        }
    },
    {
        name  : 'READER_STATE',
        label : {
            ru : 'Состояние точек доступа',
            en : 'Access point status',
            uk : 'Стан точок доступу'
        }
    },
    {
        name  : 'ACCESS_ATTEMPTS',
        label : {
            ru : 'Попытки несанкционированного доступа',
            en : 'Unauthorized access attempts',
            uk : 'Спроби несанкціонованого доступу'
        }
    }
];

export {
    referencesTypes,
    configurableTypes,
    alwaysEnabledTypes
};
