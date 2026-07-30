const { Model } = require('sequelize');

const { Logger } = require('../../utils/logger');

class BaseModel extends Model {
    constructor(...args) {
        super(...args);

        this.logger = Logger(`${this.constructor.name}${this.id ? `(${this.id})` : ''}`);
    }

    static init(sequelize, options = {}) {
        super.init(this.schema(sequelize), { ...options, sequelize });
    }

    static schema() {
        return {};
    }

    static options() {
        return {};
    }

    static initRelationsAndHooks(sequelize) {
        if (this.initRelations) this.initRelations(sequelize);
        if (this.initHooks) this.initHooks(sequelize);
    }
}

module.exports = BaseModel;
