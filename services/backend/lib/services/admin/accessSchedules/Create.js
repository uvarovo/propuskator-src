/* eslint-disable no-param-reassign,camelcase */
import Base           from '../../Base';
import AccessSchedule from '../../../models/AccessSchedule';
import {
    bitArrayToNumber,
    dumpAccessSchedule
} from '../../utils/dumps';
import sequelize      from '../../../sequelizeSingleton';
import DX from '../../../models/utils/DX';
import { BadRequestError, ValidationError } from '../../utils/SX';

export default class AccessScheduleCreate extends Base {
    validate(data) {
        const rules = {
            name       : [ 'required', 'string', 'trim', { 'max_length': 255 } ],
            enabled    : [ 'boolean', { 'default': true } ],
            isArchived : [ 'boolean', { 'default': false } ],
            dates      : [
                'required',
                {
                    'list_of_objects' : [ {
                        from               : [ 'positive_integer' ],
                        to                 : [ 'positive_integer', { greater_than_date: 'from' } ],
                        weekBitMask        : [ { 'list_of': 'boolean' }, { 'list_length_equal': 7 } ],
                        monthBitMask       : [ { 'list_of': 'boolean' }, { 'list_length_equal': 31 } ],
                        dailyIntervalStart : [ 'integer', { number_between: [ 0, 60 * 60 * 24 * 1000 ] } ],
                        dailyIntervalEnd   : [ 'integer', { number_between: [ 0, 60 * 60 * 24 * 1000 ] } ]
                    } ]
                }
            ]
        };

        return this.doValidation(data, rules);
    }

    async execute({ dates, ...data }) {
        try {
            if (dates) {
                dates = dates.map(date => {
                    if (Number.isInteger(date.from) && Number.isInteger(date.to)
                        && !date.weekBitMask && !date.monthBitMask
                        && !Number.isInteger(date.dailyIntervalStart) && !Number.isInteger(date.dailyIntervalEnd)) {
                        // 1 правило - с и до
                        return {
                            from : new Date(date.from),
                            to   : new Date(date.to)
                        };
                    } else if (!Number.isInteger(date.from) && !Number.isInteger(date.to)
                        && date.weekBitMask && !date.monthBitMask
                        && Number.isInteger(date.dailyIntervalStart) && Number.isInteger(date.dailyIntervalEnd)) {
                        // маска дней недели
                        return {
                            weekBitMask        : bitArrayToNumber(date.weekBitMask, 7),
                            dailyIntervalStart : date.dailyIntervalStart,
                            dailyIntervalEnd   : date.dailyIntervalEnd
                        };
                    } else if (Number.isInteger(date.from) && Number.isInteger(date.to)
                        && date.weekBitMask && !date.monthBitMask
                        && Number.isInteger(date.dailyIntervalStart) && Number.isInteger(date.dailyIntervalEnd)) {
                        // маска дней недели + с и до
                        return {
                            from               : new Date(date.from),
                            to                 : new Date(date.to),
                            weekBitMask        : bitArrayToNumber(date.weekBitMask, 7),
                            dailyIntervalStart : date.dailyIntervalStart,
                            dailyIntervalEnd   : date.dailyIntervalEnd
                        };
                    }
                    throw new ValidationError(ValidationError.codes.FORMAT_ERROR, { field: 'dates' });

                    // if (date.from) date.from = new Date(date.from);
                    // if (date.to) date.to = new Date(date.to);
                    // if (date.weekBitMask) date.weekBitMask = bitArrayToNumber(date.weekBitMask, 7);
                    // if (date.monthBitMask) date.monthBitMask = bitArrayToNumber(date.monthBitMask, 31);
                });
            }
            let accessSchedule = null;

            await sequelize.transaction(async transaction => {
                accessSchedule = await AccessSchedule.create({
                    ...data,
                    accessScheduleDates : dates
                }, {
                    include : [ AccessSchedule.AssociationAccessScheduleDates ],
                    transaction
                });
                await accessSchedule.reload({
                    include : [ AccessSchedule.AssociationAccessScheduleDates ],
                    transaction
                });
            });

            return {
                data : dumpAccessSchedule(accessSchedule)
            };
        } catch (e) {
            if (e instanceof DX) {
                if (e instanceof DX.ForeignKeyConstraintError) {
                    throw new BadRequestError(BadRequestError.codes.FOREIGN_KEY_CONSTRAINT, {
                        fields : e.fields, modelName : e.modelName
                    });
                } else if (e instanceof DX.UniqueConstraintError) {
                    if (e.modelName === 'AccessSchedule' && Object.keys(e.fields).length === 1 && Object.keys(e.fields)[0] === 'AccessSchedules_workspaceId_name_deletedAt_uk') {
                        throw new ValidationError(ValidationError.codes.SCHEDULE_NAME_IS_USED, { field: 'name' });
                    } else {
                        throw e;
                    }
                } else throw e;
            } else throw e;
        }
    }
}
