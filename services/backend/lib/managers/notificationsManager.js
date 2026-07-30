import { Op } from 'sequelize';
import { initLogger } from '../extensions/Logger';
import Notification from '../models/Notification';
import { notificationAlivePeriodSeconds } from '../config';

const CLEAR_INTERVAL = 1000 * 60 * 60 * 24; // 1 day

class NotificationsManager {
    constructor() {
        this.clearNotificationsTimeout = null;
        this.clearing = false;
        this.logger = initLogger('NotificationsManager');
    }
    init() {
        this.logger.info('initialized');
        this.clearNotifications();
    }
    async clearNotifications() {
        this.logger.info('clearNotifications');
        if (this.clearing) return;

        this.clearing = true;
        clearTimeout(this.clearNotificationsTimeout);
        this.clearNotificationsTimeout = null;
        try {
            await Notification.destroy({
                where : {
                    createdAt : {
                        [Op.lt] : new Date(new Date() - notificationAlivePeriodSeconds * 1000)
                    }
                }
            });
            this.logger.info('clearNotifications end');
        } catch (e) {
            this.logger.error(e);
        }
        this.clearNotificationsTimeout = setTimeout(this.clearNotifications.bind(this), CLEAR_INTERVAL);
        this.clearing = true;
    }
}

export const notificationsManager = new NotificationsManager();
