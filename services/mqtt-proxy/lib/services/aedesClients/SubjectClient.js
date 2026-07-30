/* eslint-disable max-lines-per-function */
/* eslint-disable no-param-reassign */
/* eslint-disable camelcase */
import Packet from 'aedes-packet';
import uniq from 'lodash/uniq';
import { Qlobber } from 'qlobber';
import User from '../../models/User';
import AdminUser from '../../models/AdminUser';
import AccessSubject from '../../models/AccessSubject';
import AccessSetting from '../../models/AccessSetting';
import AccessReadersGroup from '../../models/AccessReadersGroup';
import AedesBaseClient from './BaseClient';

export default class AedesSubjectClient extends AedesBaseClient {
    constructor({
        client,
        rootTopic,
        mobileToken,
        accessTokenReaderCodes,
        maxAdditionalRelaysNumber
    }) {
        super({ client });
        this.rootTopic = rootTopic;
        this.mobileToken = mobileToken;
        this.accessTokenReaderCodes = accessTokenReaderCodes;
        this.maxAdditionalRelaysNumber = maxAdditionalRelaysNumber;

        const qlobberOpts = {
            match_empty_levels : true,
            separator          : '/',
            wildcard_one       : '+',
            wildcard_some      : '#'
        };

        this.publishMatcher = new Qlobber(qlobberOpts);
        // this.subscribeBatcher = new Qlobber(qlobberOpts);
        this.forwardMatcher = new Qlobber(qlobberOpts);

        this._initMatchers();
    }

    getPublishTopicsMatchers(code) {
        const mainRelayMatcher = {
            [`sweet-home/${code}/d/s/set`] : (packet, callback) => {
                // is triggered as admin's sensor, but send to keys sensor
                // we have only one sensors
                this.defaultAuthorizePublish({
                    ...packet,
                    payload : Buffer.from(this.mobileToken),
                    topic   : `sweet-home/${code}/d/k/set`
                }, callback);
            }
        };
        const additionalRelaysMatchers = {};

        // eslint-disable-next-line more/no-c-like-loops
        for (let i = 1; i <= this.maxAdditionalRelaysNumber; i++) {
            const relaySetTopic = `sweet-home/${code}/r/s${i}/set`;
            const matcherHandler = (packet, callback) =>
                this.defaultAuthorizePublish({
                    ...packet,
                    payload : Buffer.from(this.mobileToken),
                    topic   : `sweet-home/${code}/r/k${i}/set`
                }, callback);

            additionalRelaysMatchers[relaySetTopic] = matcherHandler;
        }

        return { ...mainRelayMatcher, ...additionalRelaysMatchers };
    }

    getForwardTopicsMatchers(code) {
        const mainMatchers = {
            [`${this.rootTopic}/sweet-home/${code}/+`]                 : true,
            [`${this.rootTopic}/sweet-home/${code}/$fw/+`]             : true,
            [`${this.rootTopic}/sweet-home/${code}/$options/k1`]       : true, // analog inputs topics
            [`${this.rootTopic}/sweet-home/${code}/$options/k1/$name`] : true, //
            [`${this.rootTopic}/sweet-home/${code}/$options/k2`]       : true, //
            [`${this.rootTopic}/sweet-home/${code}/$options/k2/$name`] : true, //
            [`${this.rootTopic}/sweet-home/${code}/d/$name`]           : true,
            [`${this.rootTopic}/sweet-home/${code}/d/$state`]          : true,
            [`${this.rootTopic}/sweet-home/${code}/d/$properties`]     : (packet) => {
                // we have only one sensors
                return this.defaultAuthorizeForward({
                    ...packet,
                    payload : Buffer.from('s')
                });
            },
            [`${this.rootTopic}/sweet-home/${code}/d/s`]        : true,
            [`${this.rootTopic}/sweet-home/${code}/d/s/+`]      : true,
            [`${this.rootTopic}/errors/sweet-home/${code}/d/s`] : true,
            [`${this.rootTopic}/errors/sweet-home/${code}/d/k`] : (packet) => {
                // dont send virtual tokens to subject's aedes namespace
                return this.defaultAuthorizeForward({
                    ...packet,
                    topic   : `${this.rootTopic}/errors/sweet-home/${code}/d/s`,
                    payload : Buffer.from(JSON.stringify({ code: 'Denied', message: 'Access denied' }))
                });
            },
            [`${this.rootTopic}/sweet-home/${code}/d/k/set`] : (packet) => {
                // dont send virtual tokens to subject's aedes namespace
                return this.defaultAuthorizeForward({
                    ...packet,
                    topic   : `${this.rootTopic}/sweet-home/${code}/d/s/set`,
                    payload : Buffer.from('true')
                });
            },
            // "r" node
            [`${this.rootTopic}/sweet-home/${code}/r/$name`]  : true,
            [`${this.rootTopic}/sweet-home/${code}/r/$state`] : true
        };
        const additionalRelaysMatchers = {};

        // eslint-disable-next-line more/no-c-like-loops
        for (let i = 1; i <= this.maxAdditionalRelaysNumber; i++) {
            additionalRelaysMatchers[`${this.rootTopic}/sweet-home/${code}/r/s${i}`] = true;
            additionalRelaysMatchers[`${this.rootTopic}/sweet-home/${code}/r/s${i}/+`] = true;
            additionalRelaysMatchers[`${this.rootTopic}/errors/sweet-home/${code}/r/s${i}`] = true;
            additionalRelaysMatchers[`${this.rootTopic}/errors/sweet-home/${code}/r/k${i}`] = (packet) =>
                this.defaultAuthorizeForward({
                    ...packet,
                    topic   : `${this.rootTopic}/errors/sweet-home/${code}/r/s${i}`,
                    payload : Buffer.from(JSON.stringify({ code: 'Denied', message: 'Access denied' }))
                });
            additionalRelaysMatchers[`${this.rootTopic}/sweet-home/${code}/r/k${i}/set`] = (packet) =>
                this.defaultAuthorizeForward({
                    ...packet,
                    topic   : `${this.rootTopic}/sweet-home/${code}/r/s${i}/set`,
                    payload : Buffer.from('true')
                });
        }

        return { ...mainMatchers, ...additionalRelaysMatchers };
    }

    _initMatchers() {
        for (const code of this.accessTokenReaderCodes) {
            // publish
            const publishTopicsMatchers = this.getPublishTopicsMatchers(code);

            Object
                .entries(publishTopicsMatchers)
                .forEach(([ topic, value ]) => this.publishMatcher.add(topic, value));

            // subscribe
            // we dont care here

            // forward
            const forwardTopicsMatchers = this.getForwardTopicsMatchers(code);

            Object
                .entries(forwardTopicsMatchers)
                .forEach(([ topic, value ]) => this.forwardMatcher.add(topic, value));
        }
    }

    defaultAuthorizePublish(packet, callback) {
        callback(null, new Packet({
            ...packet,
            topic : `${this.rootTopic}/${packet.topic}`
        }));
    }

    defaultAuthorizeSubscribe(sub, callback) {
        sub.topic = `${this.rootTopic}/${sub.topic}`;
        callback(null, sub);
    }

    // eslint-disable-next-line no-unused-vars
    defaultAuthorizeForward(packet) {
        if (!packet.topic.startsWith(`${this.rootTopic}/`)) return null;

        return new Packet({
            ...packet,
            topic : packet.topic.slice(this.rootTopic.length + 1)
        });
    }

    authorizePublish(packet, callback) {
        const [ result ] = this.publishMatcher.match(packet.topic);

        if (result === true) {
            return this.defaultAuthorizePublish(packet, callback);
        } else if (typeof result === 'function') {
            return result(packet, callback);
        }

        callback(new Error('Not permitted'));
    }

    authorizeSubscribe(sub, callback) {
        this.defaultAuthorizeSubscribe(sub, callback);
    }

    // eslint-disable-next-line no-unused-vars
    authorizeForward(packet) {
        const [ result ] = this.forwardMatcher.match(packet.topic);

        if (result === true) {
            return this.defaultAuthorizeForward(packet);
        } else if (typeof result === 'function') {
            return result(packet);
        }

        return null;
    }

    static async authenticate(client, username, password, { maxAdditionalRelaysNumber }) {
        // username format `user/${workspaceId}/${email}`
        const [ type, workspaceId, email ] = username.split('/');

        if (type !== 'user') throw new Error('Bad credentials. type !== \'user\'');

        const user = await User.findOne({ where: { workspaceId, email, mqttToken: password } });

        if (!user) throw new Error('Bad credentials. !user');

        const { rootTopic } = await AdminUser.findOne({ where: { workspaceId } });

        const accessSubject = await AccessSubject.findOne({
            where : { userId: user.id }
        });

        const accessSettings = await AccessSetting.findAll({
            where : {
                enabled               : true,
                isArchived            : false,
                '$accessSubjects.id$' : accessSubject.id
            },
            // eslint-disable-next-line max-len
            // order   : [ [ sequelize.fn('LEAST', sequelize.fn('COALESCE', sequelize.col('`accessTokenReaders->usersAccessTokenReadersOrder`.`position`'), 1), sequelize.fn('COALESCE', sequelize.col('`accessReadersGroups->accessTokenReaders->usersAccessTokenReadersOrder`.`position`'), 1)), 'ASC' ] ],
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
                            // attributes  : [ 'id' ],
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
                    attributes  : [ 'id', 'code' ],
                    required    : false
                },
                {
                    where : {
                        enabled    : true,
                        isArchived : false
                    },
                    required    : true,
                    association : AccessSetting.AssociationAccessSubjects
                }
            ],
            attributes : [ 'id' ]
        });

        const accessTokenReaderCodes = uniq([
            ...accessSettings.map(s => s.accessReadersGroups.map(g => g.accessTokenReaders)).flat().flat(),
            ...accessSettings.map(s => s.accessTokenReaders).flat()
        ].map(({ code }) => code));

        return new AedesSubjectClient({
            client,
            rootTopic,
            mobileToken : accessSubject.mobileToken,
            accessTokenReaderCodes,
            maxAdditionalRelaysNumber
        });
    }
}
