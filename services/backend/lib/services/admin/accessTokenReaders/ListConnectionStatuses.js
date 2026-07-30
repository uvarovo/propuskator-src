import Base from '../../Base';
import AccessTokenReader from '../../../models/AccessTokenReader';
import DX from '../../../models/utils/DX';

export default class ListConnectionStatuses extends Base {
    static validationRules = {}
    async execute() {
        try {
            return {
                data : AccessTokenReader.connectionStatusesTitles
            };
        } catch (e) {
            if (e instanceof DX) {
                throw e;
            } else throw e;
        }
    }
}
