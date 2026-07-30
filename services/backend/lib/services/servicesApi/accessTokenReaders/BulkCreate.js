import differenceBy from 'lodash/differenceBy';

import Base                      from '../../Base';
import sequelize                 from '../../../sequelizeSingleton';
import { dumpAccessTokenReader } from '../../utils/dumps';
import AccessTokenReader         from '../../../models/AccessTokenReader';
import Workspace                 from '../../../models/Workspace';
import { ValidationError } from '../../utils/SX';

export default class BulkCreate extends Base {
    static validationRules = {
        data : [
            'required',
            {
                'list_of_objects' : [
                    {
                        name : [
                            'required',
                            'string',
                            'trim',
                            'not_empty',
                            { 'fixed_max_length': 255 },
                            { 'fixed_min_length': 1 }
                        ],
                        code : [
                            'required',
                            'string',
                            'trim',
                            'not_empty',
                            { 'fixed_max_length': 255 },
                            { 'fixed_min_length': 1 },
                            { 'custom_error_code' : [
                                'WRONG_TOKEN_READER_CODE_FORMAT', 'like', '^[a-zA-Z0-9:\\-_]+$'
                            ]
                            }
                        ]
                    }
                ]
            },
            { 'list_length_max': 500 }
        ]
    };

    async execute({ data: tokenReaders }) {
        const res = [];

        const workspaceName = this.context.payload.workspace;

        const workspace = await Workspace.findOne({ where: { name: workspaceName } });

        if (!workspace) {
            throw new ValidationError(ValidationError.codes.WORKSPACE_NOT_FOUND, { field: 'workspace' });
        }

        const workspaceId = workspace.id;

        tokenReaders.forEach(reader => {
            reader.workspaceId = workspaceId; // eslint-disable-line no-param-reassign
        });

        const readerCodes = tokenReaders.map(({ code }) => code);

        await sequelize.transaction(async transaction => {
            const exists = await AccessTokenReader.findAll({
                where : {
                    code : readerCodes,
                    workspaceId
                },
                transaction
            });

            const toCreate = differenceBy(tokenReaders, exists, 'code');

            const newReaders = await AccessTokenReader.bulkCreate(toCreate);

            res.push(...exists, ...newReaders);
        });

        return { data: res.map(dumpAccessTokenReader) };
    }
}
