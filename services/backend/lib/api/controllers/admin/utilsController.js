import chista from '../../chista.js';

import CsvToJson from '../../../services/admin/utilsServices/CsvToJson';

export default {
    csvToJson : chista.makeServiceRunner(CsvToJson, (req) => ({ file: req.file }))
};
