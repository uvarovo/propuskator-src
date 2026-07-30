module.exports = {
    port   : process.env.UPDATER_PORT || 28080,
    docker : {
        host : process.env.GITLAB_REGISTRY_HOST || '',
        auth : {
            username : process.env.GITLAB_SERVER_USER || '',
            password : process.env.GITLAB_SERVER_PASS || ''
        }
    },
    releases : {
        storageUrl         : process.env.STORAGE_URL || 'http://access-updater:28080',
        changelogPath      : process.env.CHANGELOG_PATH || 'releases/changelog',
        dockerComposesPath : process.env.DOCKER_COMPOSES_PATH || 'releases/composes',
        releasesListPath   : process.env.RELEASES_LIST_PATH || 'releases/releases-list.csv'
    },
    files : {
        ignoreYmlFiles : process.env.IGNORE_YML_FILES || '',
        syncYmlFiles   : process.env.SYNC_YML_FILES || 'docker-compose.yml',
        changelogPath  : '/app/data/changelogs',
        systemDir      : '/2smart',
        daraDir        : '/app/data'
    },
    compose : {
        projectName        : process.env.PROJECT_NAME || 'access-composer',
        updaterServiceName : process.env.UPDATER_SERVICE_NAME || 'access-updater',
        serviceManagerName : process.env.SERVICE_MANAGER_NAME || 'access-updater-manager',
        mainComposeFile    : process.env.MAIN_COMPOSE_FILE || 'docker-compose.yml'
    }
};
