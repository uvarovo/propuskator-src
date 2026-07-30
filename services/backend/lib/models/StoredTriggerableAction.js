import { DataTypes as DT } from 'sequelize';

import sequelize                  from '../sequelizeSingleton';
import { TYPES }                  from '../constants/storedTriggerableActions';
import { MILLISECONDS_IN_SECOND } from '../constants/common';
import { actions }                from '../config';
import ForbiddenError             from '../services/utils/SX/ForbiddenError';
import ValidationError            from '../services/utils/SX/ValidationError';
import { initLogger }             from '../extensions/Logger';

import Base      from './Base';
import AdminUser from './AdminUser';
import User      from './User';

const { FORMAT_ERROR, WRONG_ACTION_TYPE } = ValidationError.codes;
const {
    TOO_FREQUENT_RESET_PASSWORD_REQUESTS,
    WRONG_PASSWORD_RESET_CODE,
    RESET_PASSWORD_RETRIES_LIMIT_EXCEEDED
}                                         = ForbiddenError.codes;
const RESET_PASSWORD_INTERVAL             = +actions.resetPassword.interval * MILLISECONDS_IN_SECOND;
const RETRIES_NUMBER_LIMIT                = +actions.resetPassword.retriesNumberLimit;
const logger                              = initLogger('StoredTriggerableAction');

async function runBeforeCreateResetPasswordAction({ adminUserId, userId }, options) {
    const where = adminUserId ?
        {
            adminUserId,
            type : TYPES.RESET_ADMIN_PASSWORD
        } :
        {
            userId,
            type : TYPES.RESET_USER_PASSWORD
        };

    const lastAction = await StoredTriggerableAction.findOne({
        where,
        order : [ [ 'createdAt', 'DESC' ] ]
    });

    if (!lastAction) return;

    if (Date.now() <= lastAction.createdAt.getTime() + RESET_PASSWORD_INTERVAL) {
        throw new ForbiddenError(TOO_FREQUENT_RESET_PASSWORD_REQUESTS, {
            interval : RESET_PASSWORD_INTERVAL
        });
    }

    logger.info(`runBeforeCreateResetPasswordAction: last active action will be destroyed ${JSON.stringify({
        adminUserId,
        userId,
        lastActionId : lastAction.id
    })}`);

    await lastAction.destroy(options);
}

const ACTIONS_BY_TYPES = {
    [TYPES.LOGIN_ATTEMPTS] : {
        async validatePayload() {},
        async runBeforeCreate() {},
        async run() {}
    },
    [TYPES.RESET_ADMIN_PASSWORD] : {
        async validatePayload() {}, // this action type doesn't have a payload
        async runBeforeCreate({ adminUserId }, options) {
            await runBeforeCreateResetPasswordAction({ adminUserId }, options);
        },
        async run() {}, // this action type has implemented logic in ResetPassword service
        async runStatic() {}
    },
    [TYPES.RESET_USER_PASSWORD] : {
        async validatePayload(payload) {
            if (typeof (payload.retriesNumber) !== 'number') {
                throw new ValidationError(FORMAT_ERROR, { field: 'retriesNumber' });
            }
            if (typeof (payload.code) !== 'string') {
                throw new ValidationError(FORMAT_ERROR, { field: 'code' });
            }
        },
        async runBeforeCreate({ userId }, options) {
            await runBeforeCreateResetPasswordAction({ userId }, options);
        },
        async run() {},
        async runStatic(params) {
            const { userId, code } = params;

            const userActions = await StoredTriggerableAction.findAll({
                where : {
                    userId,
                    type : TYPES.RESET_USER_PASSWORD
                },
                paranoid : false
            });

            const targetAction = userActions.find(action => action.payload.code === code);

            if (!targetAction) {
                const lastNotDeletedAction = userActions.find(action => !action.isSoftDeleted());

                if (!lastNotDeletedAction) throw new ForbiddenError(WRONG_PASSWORD_RESET_CODE);

                const { payload } = lastNotDeletedAction;

                if (payload.retriesNumber >= RETRIES_NUMBER_LIMIT) {
                    await lastNotDeletedAction.destroy();
                } else {
                    payload.retriesNumber++;

                    await lastNotDeletedAction.update({ payload });
                }

                throw new ForbiddenError(WRONG_PASSWORD_RESET_CODE);
            }

            if (targetAction.isSoftDeleted()) {
                const { payload } = targetAction;

                if (payload.retriesNumber >= RETRIES_NUMBER_LIMIT) {
                    throw new ForbiddenError(RESET_PASSWORD_RETRIES_LIMIT_EXCEEDED, {
                        limit : RETRIES_NUMBER_LIMIT
                    });
                } else throw new ForbiddenError(WRONG_PASSWORD_RESET_CODE);
            }

            return targetAction;
        }
    },
    [TYPES.USER_REQUEST_REGISTRATION] : {
        async validatePayload() {},
        async runBeforeCreate() {},
        async run() {}
    }
};

export default class StoredTriggerableAction extends Base {
    #validatePayloadByType = async (type, payload) => {
        const actionLogic = ACTIONS_BY_TYPES[type];

        if (!actionLogic) throw new ValidationError(WRONG_ACTION_TYPE, { type });

        await actionLogic.validatePayload(payload);
    }

    static initRelations() {
        this.associationBelongsToAdminUser = this.belongsTo(AdminUser, {
            foreignKey : 'adminUserId',
            as         : 'adminUser',
            onDelete   : 'CASCADE'
        });
        this.associationBelongsToUser = this.belongsTo(User, {
            foreignKey : 'userId',
            as         : 'user',
            onDelete   : 'CASCADE'
        });
    }

    async save(...args) {
        await this.#validatePayloadByType(this.type, this.payload);

        return super.save(...args);
    }

    static async create(data, options) {
        const actionLogic = ACTIONS_BY_TYPES[data.type];

        if (actionLogic && actionLogic.runBeforeCreate) {
            await actionLogic.runBeforeCreate(data, options);
        }

        return super.create(data, options);
    }

    static async run(params, type) {
        const actionLogic = ACTIONS_BY_TYPES[type];

        logger.info({
            action : 'static run method will be called',
            type,
            params
        });

        return actionLogic.runStatic(params);
    }

    async run(params) {
        const actionLogic = ACTIONS_BY_TYPES[this.type];

        logger.info({
            action : 'run method will be called',
            type   : this.type,
            params
        });

        return actionLogic.run(params, this.payload);
    }

    async runAndDelete(params) {
        const result = await this.run(params);

        await this.destroy();

        return result;
    }
}

StoredTriggerableAction.init({
    id     : { type: DT.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    userId : {
        type       : DT.BIGINT,
        allowNull  : true,
        references : {
            model    : 'Users',
            key      : 'id',
            onDelete : 'CASCADE'
        }
    },
    adminUserId : {
        type       : DT.BIGINT,
        allowNull  : true,
        references : {
            model    : 'AdminUsers',
            key      : 'id',
            onDelete : 'CASCADE'
        }
    },
    ip        : { type: DT.STRING },
    type      : { type: DT.ENUM(Object.values(TYPES)), allowNull: false },
    payload   : { type: DT.JSON, allowNull: false, defaultValue: {} },
    createdAt : { type: DT.DATE(3), allowNull: false, defaultValue: sequelize.literal('CURRENT_TIMESTAMP(3)') },
    updatedAt : { type: DT.DATE(3) },
    deletedAt : { type: DT.DATE(3), allowNull: true }
}, {
    timestamps : true,
    paranoid   : true,
    createdAt  : false,
    sequelize
});
