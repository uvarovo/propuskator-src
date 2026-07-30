import Base                                 from '../../Base';
import { dumpAccessCamera }                 from '../../utils/dumps';
import { BadRequestError, ValidationError } from '../../utils/SX';
import sequelize                            from '../../../sequelizeSingleton';
import AccessCamera                         from '../../../models/AccessCamera';
import DX                                   from '../../../models/utils/DX';
import CameraToReaderMap                    from '../../../models/mappings/CameraToReaderMap';

export default class AccessCameraCreate extends Base {
    static validationRules = {
        name       : [ 'required', 'string', 'trim', { 'max_length': 255 }, { 'min_length': 1 } ],
        enabled    : [ 'boolean', { 'default': true } ],
        isArchived : [ 'boolean', { 'default': false } ],
        rtspUrl    : [
            'required',
            'string',
            'trim',
            { 'max_length': 2082 },
            { 'min_length': 1 },
            { 'url_with_specific_protocol': 'rtsp' }
        ],
        accessTokenReaderIds : [ { 'list_of': 'db_id' }, 'list_items_unique', 'filter_empty_values' ]
    };

    async execute({ accessTokenReaderIds, ...data }) {
        try {
            let accessCamera = null;

            await sequelize.transaction(async transaction => {
                accessCamera = await AccessCamera.create(data, { transaction });
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
                    if (e.modelName === CameraToReaderMap.name) {
                        throw new ValidationError(ValidationError.codes.ALREADY_EXISTS, {
                            entityName : e.modelName,
                            fields     : Object.entries(e.fields).map(([ tableNameWithColumnName, value ]) => {
                                const columnName = tableNameWithColumnName.split('_').pop();

                                return {
                                    name : columnName,
                                    value
                                };
                            })
                        });
                    }

                    throw e;
                } else throw e;
            } else throw e;
        }
    }
}
