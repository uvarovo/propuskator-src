/* eslint-disable max-len */
import Events from 'events';
import { Op } from 'sequelize';
import Promise from 'bluebird';
import sequelize from '../sequelize';
import AccessTokenReader from '../models/AccessTokenReader';
import Notification from '../models/Notification';
import { initLogger } from '../extensions/Logger';
import mqttTransport from '../services/mqttTransportSingleton';
import { tokenReaderActivePeriodSeconds, newTokenReaderNotificationPeriod } from '../config';
import cls from '../cls';


const SYNC_ERROR_INTERVAL = 60 * 1000;

class TokenReadersManager extends Events {
    constructor() {
        super();
        this.sync = this.sync.bind(this);
        this.synchronizing = false;
        this.syncTimeout = null;
        this.mutexes = {};
        this.tokenReadersPingTimeouts = {};
        this.logger = initLogger('TokenReadersManager');
    }
    async waitMutex(id) {
        if (!this.mutexes[id]) return;
        await new Promise((resolve) => {
            this.once(`mutex.unlocked.${id}`, resolve);
        });
    }

    async lockMutex(id) {
        while (this.mutexes[id]) await this.waitMutex(id);
        this.mutexes[id] = { lockedAt: new Date() };
        this.emit(`mutex.locked.${id}`);
    }

    async unlockMutex(id) {
        if (this.mutexes[id]) delete this.mutexes[id];
        this.emit(`mutex.unlocked.${id}`);
    }

    async doLockMutexAction(id, action) {
        try {
            await this.lockMutex(id);
            await action();
        } catch (e) {
            await this.unlockMutex(id);
            throw e;
        }
        await this.unlockMutex(id);
    }
    init() {
        this.logger.info('initializing');
        this.sync();
        this.handleBrokerStateStatusChange();
        this.logger.info('initialized');
    }
    async sync() {
        if (this.synchronizing) return;
        this.logger.info('sync');

        this.synchronizing = true;
        clearTimeout(this.syncTimeout);
        this.syncTimeout = null;
        try {
            const accessTokenReaders = await AccessTokenReader.findAll({
                where : {
                    stateStatus : AccessTokenReader.STATE_ACTIVE, // what we need
                    enabled     : true, // this is expected to indexed field
                    isArchived  : false
                }
            });

            this.logger.info(`sync accessTokenReaders.length = ${accessTokenReaders.length}`);

            const idsHash = {};

            for (const id of Object.keys(this.tokenReadersPingTimeouts)) idsHash[id] = true;
            for (const { id } of accessTokenReaders) delete idsHash[id];
            for (const id of Object.keys(idsHash)) {
                clearTimeout(this.tokenReadersPingTimeouts[id]);
                delete this.tokenReadersPingTimeouts[id];
            }

            await Promise.all(accessTokenReaders.map(this.syncAccessTokenReader.bind(this)));
        } catch (e) {
            this.logger.error(e);
            if (!this.syncTimeout) this.syncTimeout = setTimeout(this.sync.bind(this), SYNC_ERROR_INTERVAL);
        }
        this.logger.info('sync end');
        this.synchronizing = false;
    }
    setTokenReaderTimeout(id, t) {
        this.clearTokenReaderTimeout(id);
        this.logger.info(`setTokenReaderTimeout ${id} for ${t} ms`);
        this.tokenReadersPingTimeouts[id] = setTimeout(async () => {
            this.handleActiveAccessTokenReaderTimeout(id);
        }, t);
    }
    clearTokenReaderTimeout(id) {
        this.logger.info(`clearTokenReaderTimeout ${id}`);
        clearTimeout(this.tokenReadersPingTimeouts[id]);
        delete this.tokenReadersPingTimeouts[id];
    }
    syncAccessTokenReader(accessTokenReader) {
        this.logger.info(`syncAccessTokenReader ${accessTokenReader.id}`);
        const id = accessTokenReader.id;

        if (accessTokenReader.stateStatus === AccessTokenReader.STATE_ACTIVE) {
            // if (accessTokenReader.id in this.tokenReadersPingTimeouts) return; // ok, we already set a timeout
            if (!accessTokenReader.activeAt) {
                this.setTokenReaderTimeout(id, 0);

                return; // skip, strange case
            }
            this.setTokenReaderTimeout(id, 1000 * tokenReaderActivePeriodSeconds
                - (new Date() - accessTokenReader.activeAt));
        } else {
            this.clearTokenReaderTimeout(id);
        }
    }
    handleBrokerStateStatusChange() {
        // '+/sweet-home/+/$state';
        const onlyReadersStatusesRegexp = /\b[A-Fa-f0-9]{64}\/sweet-home\/[a-z0-9-]+\/\$state/g;

        mqttTransport.on('message', async (topic, message) => {
            try {
                onlyReadersStatusesRegexp.lastIndex = 0;
                if (onlyReadersStatusesRegexp.test(topic) === false) return;

                const [ loginHash, , readerId ] = topic.split('/');

                await AccessTokenReader.changeBrokerStateStatus({
                    loginHash, code : readerId, brokerStateStatus : message.toString()
                });
            } catch (e) {
                this.logger.warn(`handleBrokerStateStatusChange: ${e.message}`);
            }
        });
    }
    async handleUnknownAccessTokenReaderPing(code) {
        this.logger.info(`handleAccessTokenReaderPing ${code}`);
        await sequelize.transaction(async transaction => {
            const count = await Notification.count({
                where : {
                    type                : Notification.alwaysEnabledTypes.NEW_READER,
                    data                : { tokenReaderCode: code },
                    accessTokenReaderId : null,
                    createdAt           : { [Op.gte]: new Date(new Date() - newTokenReaderNotificationPeriod * 1000) }
                }
            });

            this.logger.info(`handleAccessTokenReaderPing count=${count}`);
            // if we have already notifications - skip

            if (count) return;
            await Notification.create({
                type    : Notification.alwaysEnabledTypes.NEW_READER,
                message : `Обнаружена точка доступа ${code}`,
                data    : { tokenReaderCode: code }
            }, { transaction });
        });
    }
    async handleAccessTokenReaderPing(accessTokenReader) {
        this.logger.info(`handleAccessTokenReaderPing ${accessTokenReader.id}`);
        // update activeAt, change if need set status = 'active' and create notification about it
        await this.doLockMutexAction(accessTokenReader.id, async () => {
            if (accessTokenReader.stateStatus === AccessTokenReader.STATE_ACTIVE) {
                await accessTokenReader.update({
                    activeAt : Date.now()
                }, { silent: true });
                /* await sequelize.query(
                    'UPDATE `AccessTokenReaders` SET `activeAt`=CURRENT_TIMESTAMP(3), `updatedAt`=`updatedAt` WHERE `id` = :id',
                    {
                        replacements : {
                            id : accessTokenReader.id
                        },
                        type : sequelize.QueryTypes.UPDATE
                    }
                );*/
                await accessTokenReader.reload();
            } else {
                await sequelize.transaction(async transaction => {
                    await accessTokenReader.reload({ transaction });

                    await accessTokenReader.update({
                        stateStatus : AccessTokenReader.STATE_ACTIVE,
                        activeAt    : Date.now()
                    }, { transaction, silent: true });

                    /* await sequelize.query(
                        'UPDATE `AccessTokenReaders` SET `stateStatus`=:stateStatus, `activeAt`=CURRENT_TIMESTAMP(3), `updatedAt`=`updatedAt` WHERE `id` = :id',
                        {
                            replacements : {
                                stateStatus : AccessTokenReader.STATE_ACTIVE,
                                id          : accessTokenReader.id
                            },
                            type : sequelize.QueryTypes.UPDATE
                        },
                        transaction
                    ); */

                    await Notification.create({
                        accessTokenReaderId : accessTokenReader.id,
                        type                : Notification.types.READER_STATE.ACTIVE_READER,
                        message             : `Точка доступа ${accessTokenReader.name} включена`
                        // message : `Token reader ${accessTokenReader.name} active.`
                    }, { transaction });

                    await accessTokenReader.reload({ transaction });
                });
            }
        });
        this.syncAccessTokenReader(accessTokenReader);
    }
    async handleActiveAccessTokenReaderTimeout(id) {
        this.logger.info(`handleActiveAccessTokenReaderTimeout ${id}`);
        // reload, check, change status='disconnected' and create notification about it
        try {
            let accessTokenReader = null;

            await this.doLockMutexAction(id, async () => {
                await sequelize.transaction(async transaction => {
                    accessTokenReader = await AccessTokenReader.findByPkOrFail(id, { transaction });

                    cls.set('workspaceId', accessTokenReader.workspaceId);
                    if (accessTokenReader.stateStatus === AccessTokenReader.STATE_ACTIVE && (
                        1000 * tokenReaderActivePeriodSeconds
                        - (new Date() - accessTokenReader.activeAt)
                    )) {
                        await accessTokenReader.update({
                            stateStatus : AccessTokenReader.STATE_DISCONNECTED
                        }, { transaction, silent: true });
                        /* await sequelize.query(
                            'UPDATE `AccessTokenReaders` SET `stateStatus`=:stateStatus, `updatedAt`=`updatedAt` WHERE `id` = :id',
                            {
                                replacements : {
                                    stateStatus : AccessTokenReader.STATE_DISCONNECTED,
                                    id          : accessTokenReader.id
                                },
                                type : sequelize.QueryTypes.UPDATE,
                                transaction
                            }
                        ); */
                        await Notification.create({
                            accessTokenReaderId : accessTokenReader.id,
                            type                : Notification.types.READER_STATE.INACTIVE_READER,
                            message             : `Точка доступа ${accessTokenReader.name} недоступна`
                            // message : `Token reader ${accessTokenReader.name} disconnected.`
                        }, { transaction });
                        await accessTokenReader.reload({ transaction });
                    } else throw new Error('Maybe object already changed.');
                });
            });

            this.syncAccessTokenReader(accessTokenReader);
        } catch (e) {
            this.logger.error(e);
            if (!this.syncTimeout) this.syncTimeout = setTimeout(this.sync.bind(this), SYNC_ERROR_INTERVAL);
        }
    }
}

export const tokenReadersManager = new TokenReadersManager();
