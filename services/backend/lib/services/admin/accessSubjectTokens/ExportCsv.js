import { v4 as uuidv4 }           from 'uuid';
import { createObjectCsvWriter }  from 'csv-writer';
import Base                       from '../../Base';
import AccessSubjectToken         from '../../../models/AccessSubjectToken';
import { NotFoundError }          from '../../utils/SX';
import { staticPath, appWorkDir } from '../../../config';

export default class AccessSubjectTokenExportCsv extends Base {
    static validationRules = {}

    _pathToSaveCsv = `/${appWorkDir}/${staticPath}/csv-export/access-subjects-tokens/tokens-${uuidv4()}.csv`
    _columnsMapping = [
        { id: 'id', title: 'id' },
        { id: 'name', title: 'name' },
        { id: 'code', title: 'code' },
        { id: 'enabled', title: 'enabled' },
        { id: 'isArchived', title: 'isArchived' },
        { id: 'createdAt', title: 'createdAt' },
        { id: 'updatedAt', title: 'updatedAt' }
    ]

    async execute() {
        const records = await this._getSerializedTokens();
        const csvWriter = this._initCsvWriter();

        await csvWriter.writeRecords(records);

        return this._pathToSaveCsv;
    }

    _initCsvWriter() {
        return createObjectCsvWriter({
            path   : this._pathToSaveCsv,
            header : this._columnsMapping
        });
    }

    async _getSerializedTokens() {
        const records = await AccessSubjectToken.findAll({ where: { workspaceId: this.cls.get('workspaceId') } });

        if (records.length === 0) {
            throw new NotFoundError(NotFoundError.codes.CANNOT_FIND_MODEL, { modelName: 'AccessSubjectTokens' });
        }

        return records.map(r => r.toJSON());
    }
}
