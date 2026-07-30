import Base                  from '../../Base';
import AccessCamera         from '../../../models/AccessCamera';
import { dumpAccessCamera } from '../../utils/dumps';
import sequelize             from '../../../sequelizeSingleton';
import DX from '../../../models/utils/DX';
import { BadRequestError, NotFoundError } from '../../utils/SX';

export default class AccessCameraUpdate extends Base {
    validate(data) {
        const rules = {
            id                   : [ 'required', 'db_id' ],
            name                 : [ 'string', 'trim', { 'max_length': 255 }, { 'min_length': 1 } ],
            enabled              : [ 'boolean' ],
            isArchived           : [ 'boolean' ],
            accessTokenReaderIds : [ { 'list_of': 'db_id' }, 'list_items_unique', 'filter_empty_values' ]
        };

        // ignore rtspUrl with empty string value
        if (data.rtspUrl) {
            rules.rtspUrl = [
                'string',
                'trim',
                { 'max_length': 2082 },
                { 'min_length': 1 },
                { 'url_with_specific_protocol': 'rtsp' }
            ];
        }

        return this.doValidation(data, rules);
    }

    async execute({ id, accessTokenReaderIds, ...data }) {
        try {
            let accessCamera = null;

            await sequelize.transaction(async transaction => {
                accessCamera = await AccessCamera.findByPkOrFail(id, { transaction });

                await accessCamera.update(data, { transaction });
                // timestamps do not update by `.update` of model instance
                await AccessCamera.update({ updatedAt: Date.now() }, { where: { id }, transaction });

                if (accessTokenReaderIds) {
                    await accessCamera.setAccessTokenReaders(accessTokenReaderIds, { transaction });
                }
                await accessCamera.reload({
                    include : [ { association: AccessCamera.AssociationAccessTokenReaders, required: false } ],
                    transaction
                });
            });

            return {
                data : dumpAccessCamera(accessCamera)
            };
        } catch (e) {
            if (e instanceof DX) {
                if (e instanceof DX.ForeignKeyConstraintError) {
                    throw new BadRequestError(BadRequestError.codes.FOREIGN_KEY_CONSTRAINT, {
                        fields : e.fields, modelName : e.modelName
                    });
                } else if (e instanceof DX.UniqueConstraintError) {
                    throw e;
                } else if (e instanceof DX.NotFoundError) {
                    throw new NotFoundError(NotFoundError.codes.CANNOT_FIND_MODEL, {
                        modelName : e.modelName, primaryKey : e.primaryKey
                    });
                } else throw e;
            } else throw e;
        }
    }
}
