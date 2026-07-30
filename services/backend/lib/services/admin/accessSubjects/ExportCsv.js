import { v4 as uuidv4 }           from 'uuid';
import { createObjectCsvWriter }  from 'csv-writer';
import Base                       from '../../Base';
import AccessSubject              from '../../../models/AccessSubject';
import { NotFoundError }          from '../../utils/SX';
import { appWorkDir, staticPath } from '../../../config';

export default class AccessSubjectExportCsv extends Base {
    static validationRules = {}

    _pathToSaveCsv = `/${appWorkDir}/${staticPath}/csv-export/access-subjects/subjects-${uuidv4()}.csv`
    _columnsMapping = [
        { id: 'id', title: 'id' },
        { id: 'email', title: 'email' },
        { id: 'name', title: 'name' },
        { id: 'phone', title: 'phone' },
        { id: 'position', title: 'position' },
        { id: 'accessSubjectTokens', title: 'accessSubjectTokens' },
        { id: 'mobileEnabled', title: 'mobileEnabled' },
        { id: 'isArchived', title: 'isArchived' },
        { id: 'enabled', title: 'enabled' },
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
        const records = await AccessSubject.findAll({
            where   : { workspaceId: this.cls.get('workspaceId') },
            include : [
                {
                    association : AccessSubject.AssociationAccessSubjectTokens,
                    attributes  : [ 'id' ],
                    required    : false
                }
            ],
            distinct : true
        });

        if (records.length === 0) {
            throw new NotFoundError(NotFoundError.codes.CANNOT_FIND_MODEL, { modelName: 'AccessSubjects' });
        }

        return records.map(r => {
            return { ...r.toJSON(), accessSubjectTokens: this._stringifyTokens(r.accessSubjectTokens) };
        });
    }

    _stringifyTokens(accessSubjectTokens) {
        const tokensIds = accessSubjectTokens.map(t => t.id);

        return tokensIds.join(', ');
    }
}
