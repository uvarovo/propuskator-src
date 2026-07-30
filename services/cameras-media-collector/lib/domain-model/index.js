const Sequelize = require('sequelize');

const dbConfig = require('../../config/db')[process.env.NODE_ENV || 'development'];

const AccessCamera      = require('./sequelize/AccessCamera');
const AccessTokenReader = require('./sequelize/AccessTokenReader');
const CameraToReaderMap = require('./sequelize/CameraToReaderMap');
const Workspace         = require('./sequelize/Workspaces');

function initSequelizeModels(config) {
    const { database, username, password, dialect, host, port, pool, logging } = config;

    const sequelize = new Sequelize(database, username, password, {
        host,
        port,
        dialect,
        pool,
        logging
    });

    const models = {
        AccessCamera,
        AccessTokenReader,
        CameraToReaderMap,
        Workspace
    };

    Object.values(models).forEach((model) => model.init(sequelize, model.options()));
    Object.values(models).forEach((model) => model.initRelationsAndHooks(sequelize));

    return models;
}

function initAllModels({ sequelizeConfig }) {
    const sequelizeModels = initSequelizeModels(sequelizeConfig);

    return {
        sequelize : sequelizeModels
    };
}

module.exports = {
    initAllModels,
    models : initAllModels({ sequelizeConfig: dbConfig })
};
