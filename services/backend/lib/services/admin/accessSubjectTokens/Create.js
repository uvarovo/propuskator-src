import Base                       from '../../Base';
import AccessSubjectToken         from '../../../models/AccessSubjectToken';
import { dumpAccessSubjectToken } from '../../utils/dumps';
import sequelize                  from '../../../sequelizeSingleton';
import Notification from '../../../models/Notification';
import DX from '../../../models/utils/DX';
import { BadRequestError, ValidationError } from '../../utils/SX';

export default class AccessSubjectTokenCreate extends Base {
    static validationRules = {
        name            : [ 'required', 'string', 'trim', 'not_empty', { 'fixed_max_length': 255 }, { 'fixed_min_length': 1 } ],
        code            : [ 'required', 'string', 'trim', 'not_empty', { 'fixed_max_length': 255 }, { 'fixed_min_length': 1 },  { 'custom_error_code': [ 'WRONG_ACCESS_SUBJECT_TOKEN_CODE_FORMAT', 'like', '^[A-Z0-9]+$' ] } ],
        // type : [ 'string', 'trim', { 'one_of': [ AccessSubjectToken.TYPE_NFC, AccessSubjectToken.TYPE_RFID ] } ],
        enabled         : [ 'boolean', { 'default': true } ],
        isArchived      : [ 'boolean', { 'default': false } ],
        accessSubjectId : [ 'db_id' ]
    };

    async execute(data) {
        try {
            let accessSubjectToken = null;

            await sequelize.transaction(async transaction => {
                accessSubjectToken = await AccessSubjectToken.create(data, { transaction });
                await accessSubjectToken.updateReaderTokens({ transaction });
                await accessSubjectToken.reload({ transaction });
                await Notification.update({
                    accessSubjectTokenId : accessSubjectToken.id
                }, {
                    where : {
                        type                 : Notification.alwaysEnabledTypes.UNKNOWN_TOKEN,
                        accessSubjectTokenId : null,
                        data                 : { tokenCode: accessSubjectToken.code }
                    },
                    transaction
                });
            });

            return {
                data : dumpAccessSubjectToken(accessSubjectToken)
            };
        } catch (e) {
            if (e instanceof DX) {
                if (e instanceof DX.ForeignKeyConstraintError) {
                    throw new BadRequestError(BadRequestError.codes.FOREIGN_KEY_CONSTRAINT, {
                        fields : e.fields, modelName : e.modelName
                    });
                } else if (e instanceof DX.UniqueConstraintError) {
                    if (e.modelName === 'AccessSubjectToken' && Object.keys(e.fields).length === 1 && Object.keys(e.fields)[0] === 'AccessSubjectTokens_workspaceId_code_deletedAt_uk') {
                        throw new ValidationError(ValidationError.codes.TOKEN_CODE_IS_USED, { field: 'code' });
                    } else {
                        throw e;
                    }
                } else throw e;
            } else throw e;
        }
    }
}
