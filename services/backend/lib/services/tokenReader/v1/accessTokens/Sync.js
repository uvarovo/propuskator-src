/* eslint-disable object-property-newline */
// eslint-disable-next-line no-unused-vars
import _Uniq from 'lodash/uniq';
import { Op } from 'sequelize';
import _Max from 'lodash/max';
import Base from '../../../Base';
import AccessSetting from '../../../../models/AccessSetting';
import AccessTokenReader from '../../../../models/AccessTokenReader';
import AccessReadersGroup from '../../../../models/AccessReadersGroup';
import AccessSchedule from '../../../../models/AccessSchedule';
import AccessSubject from '../../../../models/AccessSubject';
import AccessTokenToReaderChangesMap from '../../../../models/AccessTokenToReaderChangesMap';
import { ACTION_TYPES } from '../../../../constants/accessTokenToReaderChangesMap.js';
import sequelize from '../../../../sequelizeSingleton';
import { ValidationError } from '../../../utils/SX';

export default class AccessTokensSync extends Base {
    static validationRules = {
        body : [ 'string' ]
    };

    // eslint-disable-next-line no-unused-vars
    parseBody(body) {
        const result = { time: null, tokens: null };

        if (!body) return result;
        const parsed = body.split('%');

        if (parsed.length >= 1 && parsed[0].length) {
            result.time = new Date(parseInt(parsed[0], 10) * 60 * 1000);
            if (isNaN(result.time)) {
                throw new ValidationError(ValidationError.codes.FORMAT_ERROR, { field: 'time' });
            }
        }
        if (parsed.length >= 2) {
            result.tokens = parsed[1].split(',').map(v => v.trim()).filter(v => v);
        }

        return result;
    }
    async execute({ body }) {
        try {
            // eslint-disable-next-line prefer-const
            let { tokenReaderId : accessTokenReaderId, tokenReaderActiveAt } = this.context;

            tokenReaderActiveAt = tokenReaderActiveAt || new Date();
            // eslint-disable-next-line prefer-const
            let { time, tokens } = this.parseBody(body);

            const isFullSync = time.getTime() === 0;

            // clear old rows
            // access reader will save "lastUpdatedAt" (time) only after successfull sync
            // backend can send response, but access reader can die or fail in sync
            // in this case, access reader will send old "lastUpdatedAt" (time)
            await AccessTokenToReaderChangesMap.destroy({
                where : { accessTokenReaderId, updatedAt: { [Op.lt]: time } }
            });

            if (this.logger) this.logger.info({ id: accessTokenReaderId, time, tokens });

            let lastUpdatedAt = tokenReaderActiveAt > time ? tokenReaderActiveAt : time;

            const resultDelete = {};
            const resultUpdate = {};

            await sequelize.transaction(async transaction => {
                // retrieve all changes for the current reader
                const accessTokenToReaderChangesMaps = await this._getTokenToReaderChanges(accessTokenReaderId, time);

                // if reader sends time=0 we should send all rules to it
                if (!accessTokenToReaderChangesMaps.length && !isFullSync) {
                    return this._getNoChangesResponse(lastUpdatedAt);
                }

                // array of virtual codes like "0IBWTUI4ODQS" without "phn" or "sbj"
                const accessSubjectVirtualTokens = [];
                const accessSubjectTokenCodes = accessTokenToReaderChangesMaps.map(({ accessSubjectTokenCode }) => {
                    const map = accessSubjectTokenCode.split('-');

                    if (map.length === 2) {
                        if ([ 'sbj', 'phn' ].includes(map[0])) accessSubjectVirtualTokens.push(map[1]); // mobile and phone tokens

                        return null;
                    }

                    return accessSubjectTokenCode;
                }).filter(v => v);

                lastUpdatedAt = _Max([
                    lastUpdatedAt,
                    ...accessTokenToReaderChangesMaps.map(({ updatedAt }) => updatedAt)
                ]);

                // set codes from changes that are related to "REMOVE_ACCESS" and "UPDATE_ACCESS" actions
                // types for deleting
                // When action type is "REMOVE_ACCESS" it is need to delete rules for this codes from controller's
                // memory
                // When action type is "UPDATE_ACCESS" it is need to delete rules for this codes from controller's
                // memory to delete previous rules and write new
                accessTokenToReaderChangesMaps
                    .filter(({ actionType }) =>
                        actionType === ACTION_TYPES.REMOVE_ACCESS || actionType === ACTION_TYPES.UPDATE_ACCESS
                    )
                    .forEach(({ accessSubjectTokenCode }) => resultDelete[accessSubjectTokenCode] = true);

                const accessTokenReader = await AccessTokenReader.findByPkOrFail(accessTokenReaderId);

                if (accessTokenReader.resetRules) {
                    if ((+time) === 0) await accessTokenReader.update({ resetRules: false });
                    else lastUpdatedAt = time = new Date(0);
                }

                if (this.logger) this.logger.info('start');

                // tokens that are related to tags
                const tokenSettings = await this._getTokenSettings(
                    accessSubjectTokenCodes,
                    accessTokenReaderId,
                    time,
                    transaction
                );
                // tokens that are related to mobile and phone access
                const virtualTokenSettings = await this._getVirtualTokenSettings(
                    accessSubjectVirtualTokens,
                    accessTokenReaderId,
                    time,
                    transaction
                );
                // get all enabled cases with list of updated above
                const allSettings = [ ...tokenSettings, ...virtualTokenSettings ];

                for (const accessSetting of allSettings) {
                    for (const accessSubject of accessSetting.accessSubjects) {
                        let allRules = [];

                        for (const accessSchedule of accessSetting.accessSchedules) {
                            const rules = await accessSchedule.getDatesStringRules();

                            allRules = [ ...allRules, ...rules ];
                        }

                        if (!allRules.length) return;

                        // TODO: refactor next two conditions - avoid code duplicating
                        if (accessSubject.mobileEnabled) {
                            const code = accessSubject.mobileToken;
                            const changes = accessTokenToReaderChangesMaps
                                .find(({ accessSubjectTokenCode }) => accessSubjectTokenCode === code);

                            if (isFullSync) {
                                resultUpdate[code] = (resultUpdate[code] || []).concat(allRules);
                            } else if (changes) {
                                // check for mobile token changes because it and phone call token have
                                // the same virtual token and changes may be related only for phone call token
                                const specificRules = changes.data?.rules;

                                resultUpdate[code] = changes.actionType === ACTION_TYPES.ADD_ACCESS && specificRules ?
                                    specificRules :
                                    (resultUpdate[code] || []).concat(allRules);
                            }
                        }
                        if (accessSubject.phoneEnabled) {
                            const code = accessSubject.phoneToken;
                            const changes = accessTokenToReaderChangesMaps
                                .find(({ accessSubjectTokenCode }) => accessSubjectTokenCode === code);

                            if (isFullSync) {
                                resultUpdate[code] = (resultUpdate[code] || []).concat(allRules);
                            } else if (changes) {
                                // check for phone call changes because it and mobile token have
                                // the same virtual token and changes may be related only for mobile token
                                const specificRules = changes.data?.rules;

                                resultUpdate[code] = changes.actionType === ACTION_TYPES.ADD_ACCESS && specificRules ?
                                    specificRules :
                                    (resultUpdate[code] || []).concat(allRules);
                            }
                        }
                        if (accessSubject.accessSubjectTokens) {
                            accessSubject.accessSubjectTokens.forEach(({ code }) => {
                                const changes = accessTokenToReaderChangesMaps
                                    .find(({ accessSubjectTokenCode }) => accessSubjectTokenCode === code);

                                if (isFullSync) {
                                    resultUpdate[code] = (resultUpdate[code] || []).concat(allRules);
                                } else if (changes) {
                                    const specificRules = changes.data?.rules;

                                    resultUpdate[code] = (
                                        changes.actionType === ACTION_TYPES.ADD_ACCESS &&
                                        specificRules
                                    ) ?
                                        specificRules :
                                        (resultUpdate[code] || []).concat(allRules);
                                }
                            });
                        }
                    }
                }
            });

            if (this.logger) this.logger.info({ id: accessTokenReaderId, lastUpdatedAt, resultDelete, resultUpdate });

            return `${
                Math.floor(lastUpdatedAt / 60 / 1000)
            }%${
                Object.keys(resultDelete).join(',')
            }%\n${
                [].concat(...Object.entries(resultUpdate).map(([ k, r ]) => _Uniq(r).map(v => `${k}_/${v}`))).join('\n')
            }`;
        } catch (e) {
            throw e;
        }
    }

    async _getTokenToReaderChanges(accessTokenReaderId, time) {
        return AccessTokenToReaderChangesMap.findAll({
            where : { accessTokenReaderId, updatedAt: { [Op.gte]: time } }
        });
    }

    async _getTokenSettings(accessSubjectTokenCodes, accessTokenReaderId, time, transaction) {
        return AccessSetting.findAll({
            where : {
                enabled    : true,
                isArchived : false,
                [Op.or]    : [
                    {
                        '$accessReadersGroups->accessTokenReaders.id$' : accessTokenReaderId
                    },
                    {
                        '$accessTokenReaders.id$' : accessTokenReaderId
                    }
                ]
            },
            include : [
                {
                    where : {
                        enabled    : true,
                        isArchived : false
                    },
                    association : AccessSetting.AssociationAccessReadersGroups,
                    include     : [
                        {
                            where : {
                                enabled    : true,
                                isArchived : false
                            },
                            association : AccessReadersGroup.AssociationAccessTokenReaders,
                            attributes  : [ 'id' ],
                            required    : false
                        }
                    ],
                    attributes : [ 'id' ],
                    required   : false
                },
                {
                    where : {
                        enabled    : true,
                        isArchived : false
                    },
                    association : AccessSetting.AssociationAccessTokenReaders,
                    attributes  : [ 'id' ],
                    required    : false
                },
                {
                    where : {
                        enabled    : true,
                        isArchived : false
                    },
                    association : AccessSetting.AssociationAccessSchedules,
                    include     : [ {
                        association : AccessSchedule.AssociationAccessScheduleDates,
                        required    : true
                    } ],
                    attributes : [ 'id' ],
                    required   : true
                },
                {
                    where : {
                        enabled    : true,
                        isArchived : false
                    },
                    association : AccessSetting.AssociationAccessSubjects,
                    include     : [ {
                        where : {
                            // handle special case time === 0, i.e. load all rules
                            ...((time > 0) ? { code: accessSubjectTokenCodes } : {}),
                            enabled    : true,
                            isArchived : false
                        },
                        association : AccessSubject.AssociationAccessSubjectTokens,
                        required    : true
                    } ],
                    attributes : [ 'id' ],
                    required   : true
                }
            ],
            attributes : [ 'id' ],
            transaction
        });
    }

    async _getVirtualTokenSettings(accessSubjectVirtualTokens, accessTokenReaderId, time, transaction) {
        return AccessSetting.findAll({
            where : {
                enabled    : true,
                isArchived : false,
                [Op.or]    : [
                    {
                        '$accessReadersGroups->accessTokenReaders.id$' : accessTokenReaderId
                    },
                    {
                        '$accessTokenReaders.id$' : accessTokenReaderId
                    }
                ]
            },
            include : [
                {
                    where : {
                        enabled    : true,
                        isArchived : false
                    },
                    association : AccessSetting.AssociationAccessReadersGroups,
                    include     : [
                        {
                            where : {
                                enabled    : true,
                                isArchived : false
                            },
                            association : AccessReadersGroup.AssociationAccessTokenReaders,
                            attributes  : [ 'id' ],
                            required    : false
                        }
                    ],
                    attributes : [ 'id' ],
                    required   : false
                },
                {
                    where : {
                        enabled    : true,
                        isArchived : false
                    },
                    association : AccessSetting.AssociationAccessTokenReaders,
                    attributes  : [ 'id' ],
                    required    : false
                },
                {
                    where : {
                        enabled    : true,
                        isArchived : false
                    },
                    association : AccessSetting.AssociationAccessSchedules,
                    include     : [ {
                        association : AccessSchedule.AssociationAccessScheduleDates,
                        required    : true
                    } ],
                    attributes : [ 'id' ],
                    required   : true
                },
                {
                    where : {
                        enabled    : true,
                        isArchived : false,
                        ...((time > 0) ? { virtualCode: accessSubjectVirtualTokens } : {})
                    },
                    association : AccessSetting.AssociationAccessSubjects,
                    attributes  : [ 'id', 'mobileEnabled', 'phoneEnabled', 'virtualCode' ],
                    required    : true
                }
            ],
            attributes : [ 'id' ],
            transaction
        });
    }

    _getNoChangesResponse(lastUpdatedAt) {
        return `${Math.floor(lastUpdatedAt / 60 / 1000)}%%\n`;
    }
}

