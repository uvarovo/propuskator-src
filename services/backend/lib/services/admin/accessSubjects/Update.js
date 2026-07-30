import _Difference from 'lodash/difference';

import AccessSubject from '../../../models/AccessSubject';
import AccessTokenToReaderChangesMap from '../../../models/AccessTokenToReaderChangesMap.js';
import sequelize from '../../../sequelizeSingleton';
import { ACTION_TYPES } from '../../../constants/accessTokenToReaderChangesMap';
import Base from '../../Base';
import { dumpAccessSubject } from '../../utils/dumps';
import DX from '../../../models/utils/DX';
import { BadRequestError, NotFoundError, ValidationError } from '../../utils/SX';
import checkPhoneIsUnique from './utils/checkPhoneIsUnique';

export default class AccessSubjectUpdate extends Base {
    validate(data) {
        const rules = {
            id        : [ 'required', 'db_id' ],
            name      : [ 'not_empty', 'string', 'trim', { 'max_length': 255 }, { 'min_length': 1 } ],
            position  : [ 'string', 'trim', { 'max_length': 255 }, { 'min_length': 1 } ],
            email     : [ 'string', 'trim', 'fixed_email', { 'max_length': 255 }, { 'min_length': 1 } ],
            phone     : [ 'string', 'trim', 'phone', { 'max_length': 255 }, { 'min_length': 1 } ],
            avatarImg : [
                {
                    'nested_object' : {
                        buffer       : [ 'required' ],
                        mimetype     : [ 'required', 'string', 'trim', { 'one_of': [ 'image/png', 'image/jpg', 'image/jpeg' ] } ],
                        originalname : [ 'required', 'string', 'trim' ]
                    }
                }
            ],
            enabled               : [ 'boolean' ],
            phoneEnabled          : [ 'boolean' ],
            isArchived            : [ 'boolean' ],
            mobileEnabled         : [ 'boolean' ],
            accessSubjectTokenIds : [ { 'list_of': 'db_id' }, 'list_items_unique', 'filter_empty_values' ],
            canAttachTokens       : [ 'boolean' ]
        };

        if (data.mobileEnabled === true || data.mobileEnabled === 'true' || data.mobileEnabled === null) {
            // rules.email = [ { 'custom_error_code': [ 'REQUIRED_EMAIL_ON_MOBILE', 'required' ] }, ...rules.email ];
            rules.email = [ 'required', ...rules.email ];
        }
        if (data.phoneEnabled === true || data.phoneEnabled === 'true') rules.phone = [ 'required', ...rules.phone ];

        return this.doValidation(data, rules);
    }

    async execute({ id, accessSubjectTokenIds, email, avatarImg, ...data }) {
        try {
            let accessSubject = null;

            await sequelize.transaction(async (transaction) => {
                accessSubject = await AccessSubject.findByPkOrFail(id, { transaction });

                const isPhoneUnique = await checkPhoneIsUnique({
                    workspaceId : this.cls.get('workspaceId'),
                    phone       : data.phone,
                    accessSubject
                });

                if (!isPhoneUnique) {
                    throw new ValidationError(ValidationError.codes.SUBJECT_PHONE_IS_USED, { field: 'phone' });
                }
                // accessSubject.changed('updatedAt', true);
                accessSubject.set({
                    ...data,
                    updatedAt : sequelize.fn('CURRENT_TIMESTAMP', 3)
                });

                if (email) {
                    accessSubject.set({
                        email,
                        isInvited : this._isEmailChanging({ oldEmail: accessSubject.email, newEmail: email })
                            ? false
                            : accessSubject.isInvited
                    });
                }

                // retrieve associated data only when reader is enabled, because when reader is disabled
                // it should not receive updates
                const oldAssociatedEntitiesData = accessSubject.enabled
                    ? await accessSubject.getAssociatedEntitiesData({ transaction })
                    : null;

                await accessSubject.save({ transaction });

                if (accessSubjectTokenIds) {
                    await accessSubject.setAccessSubjectTokens(accessSubjectTokenIds, {
                        transaction,
                        individualHooks : true
                    });
                }

                // calculate and save changes only when subject is enabled
                if (accessSubject.enabled) {
                    const newAssociatedEntitiesData = await accessSubject.getAssociatedEntitiesData({ transaction });

                    const removedAccessSubjectTokenCodes = _Difference(
                        oldAssociatedEntitiesData.accessSubjectTokenCodes,
                        newAssociatedEntitiesData.accessSubjectTokenCodes
                    );
                    const addedAccessSubjectTokenCodes = _Difference(
                        newAssociatedEntitiesData.accessSubjectTokenCodes,
                        oldAssociatedEntitiesData.accessSubjectTokenCodes
                    );

                    if (removedAccessSubjectTokenCodes.length) {
                        await AccessTokenToReaderChangesMap.addUpdates(
                            {
                                accessTokenReaderIds    : newAssociatedEntitiesData.accessTokenReaderIds,
                                accessSubjectTokenCodes : removedAccessSubjectTokenCodes,
                                actionType              : ACTION_TYPES.REMOVE_ACCESS
                            },
                            { transaction }
                        );
                    }
                    if (addedAccessSubjectTokenCodes.length) {
                        await AccessTokenToReaderChangesMap.addUpdates(
                            {
                                accessTokenReaderIds    : newAssociatedEntitiesData.accessTokenReaderIds,
                                accessSubjectTokenCodes : addedAccessSubjectTokenCodes,
                                actionType              : ACTION_TYPES.ADD_ACCESS
                            },
                            { transaction }
                        );
                    }
                }

                await accessSubject.reload({
                    include : [ { association: AccessSubject.AssociationAccessSubjectTokens, required: false } ],
                    transaction
                });
            });

            if (avatarImg === '') await accessSubject.deleteAvatarImage();
            else if (typeof avatarImg === 'object') await accessSubject.setAvatarImage(avatarImg);

            return {
                data : dumpAccessSubject(accessSubject)
            };
        } catch (e) {
            if (e instanceof DX) {
                if (e instanceof DX.ForeignKeyConstraintError) {
                    throw new BadRequestError(BadRequestError.codes.FOREIGN_KEY_CONSTRAINT, {
                        fields    : e.fields,
                        modelName : e.modelName
                    });
                } else if (e instanceof DX.UniqueConstraintError) {
                    if (
                        e.modelName === 'AccessSubject' &&
                        Object.keys(e.fields).length === 1 &&
                        Object.keys(e.fields)[0] === 'AccessSubjects_workspaceId_name_deletedAt_uk'
                    ) {
                        throw new ValidationError(ValidationError.codes.SUBJECT_NAME_IS_USED, { field: 'name' });
                    } else if (
                        e.modelName === 'AccessSubject' &&
                        Object.keys(e.fields).length === 1 &&
                        Object.keys(e.fields)[0] === 'AccessSubjects_workspaceId_email_deletedAt_uk'
                    ) {
                        throw new ValidationError(ValidationError.codes.SUBJECT_EMAIL_IS_USED, { field: 'email' });
                    } else {
                        throw e;
                    }
                } else if (e instanceof DX.NotFoundError) {
                    throw new NotFoundError(NotFoundError.codes.CANNOT_FIND_MODEL, {
                        modelName  : e.modelName,
                        primaryKey : e.primaryKey
                    });
                } else throw e;
            } else throw e;
        }
    }

    _isEmailChanging({ oldEmail, newEmail }) {
        if (!newEmail || oldEmail === newEmail) return false;

        if (oldEmail !== newEmail) return true;

        return false;
    }
}
