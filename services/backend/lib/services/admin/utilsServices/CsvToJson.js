import csvtojson from 'csvtojson';
import Base from '../../Base';

export default class CsvToJson extends Base {
    static validationRules = {
        file : [ 'required' ]
    };

    async execute({ file }) {
        const csvStr = file.buffer.toString();

        const json = await csvtojson().fromString(csvStr);

        return {
            data : json
        };
    }
}
