import { Op } from 'sequelize';

import StoredTriggerableAction from '../models/StoredTriggerableAction';
import { TYPES } from '../constants/storedTriggerableActions';
import AttemptsType from '../constants/attemptsTypes';
import { attemptsOptions } from '../config';

const typesUser = {
    admin : 'adminUserId',
    user  : 'userId'
};

const DEFAULT_ATTEMPTS_COUNT = +attemptsOptions.attemptsCount;

/**
 * @param {string} type for rand blocked or attempts
 * @returns {Array<Date, Date>} start date and finish date for range
 */
function getDateBetween(type = AttemptsType.attempts) {
    const dateFrom = new Date();
    const { interval, blockedTime } = attemptsOptions;

    let time = 60; // default value 60

    if (type === AttemptsType.attempts) {
        time = +interval;
    } else if (type === AttemptsType.block) {
        time = +blockedTime;
    }

    dateFrom.setSeconds(dateFrom.getSeconds() - time);

    return [
        dateFrom,
        new Date()
    ];
}

/**
 * @param {string} ip IP address user
 * @param {string} type for search range
 * @param {string} findparam param to search rand (createdAt | updatedAt)
 * @param {string} actionType type of stored triggerable action to find
 * @returns {Promise<StoredTriggerableAction>}
 */
async function findAttemptDiapasonDate(
    typeUser,
    ip,
    id,
    type = AttemptsType.attempts,
    findparam = 'createdAt',
    actionType = TYPES.LOGIN_ATTEMPTS
) {
    const [ startDate, endDate ] = getDateBetween(type);

    const fieldUser = typesUser[typeUser];
    const props = {
        where : {
            ip,
            [findparam] : {
                [Op.between] : [ startDate, endDate ]
            },
            type : actionType
        },
        order : [
            [ 'id', 'ASC' ]
        ]
    };

    if (fieldUser) props.where[fieldUser] = id;

    const storedTriggerableActions = await StoredTriggerableAction.findAll(props);

    return storedTriggerableActions;
}

/**
 * check IP is not blocked
 * @param {string} ip IP address user
 * @param {string} actionType type of stored triggerable action to check
 */
async function checkRequestsFromIPBlocked(
    typeUser,
    ip,
    id,
    actionType,
    { attemptsCount = DEFAULT_ATTEMPTS_COUNT } = {}
) {
    // check ip in record where attempts more then $attemptsCount
    const storedTriggerableActions = await findAttemptDiapasonDate(
        typeUser,
        ip,
        id,
        AttemptsType.block,
        'updatedAt',
        actionType
    );

    return storedTriggerableActions.length > 0 && storedTriggerableActions[0].payload.attempts >= attemptsCount;
}

/**
 * save the login attempt to the database
 * @param {string} ip IP address user
 * @param {string} actionType type of stored triggerable action to add attampt to
 */
async function addRequestToAttempts(typeUser, ip, id, actionType = TYPES.LOGIN_ATTEMPTS) {
    const storedTriggerableActions = await findAttemptDiapasonDate(
        typeUser,
        ip,
        id,
        AttemptsType.attempts,
        'createdAt',
        actionType
    );
    const fieldUser = typesUser[typeUser];

    if (storedTriggerableActions.length > 0) {
        const { payload : { attempts } } = storedTriggerableActions[0];

        // TODO: sometimes attempts count is greater than "attempts + storedTriggerableActions.length"
        // (even if storedTriggerableActions contains only one action)
        await storedTriggerableActions[0].update({
            type    : actionType,
            payload : {
                attempts : attempts + storedTriggerableActions.length // if we get duplicate N in another way 1
            }
        });
        // condition to remove duplicate
        if (storedTriggerableActions.length > 1) {
            const records = storedTriggerableActions.slice(1);
            const ids = records.map(el => el.id);
            const destroyOptions = {
                where : {
                    id : {
                        [Op.in] : [ ...ids ]
                    }
                }
            };

            if (fieldUser) destroyOptions.where[fieldUser] = id;

            await StoredTriggerableAction.destroy(destroyOptions);
        }
    } else {
        const createFields = {
            type    : actionType,
            ip,
            payload : {
                attempts : 1
            }
        };

        if (fieldUser) createFields[fieldUser] = id;

        await StoredTriggerableAction.create(createFields);
    }
}

export default {
    checkRequestsFromIPBlocked,
    addRequestToAttempts
};
