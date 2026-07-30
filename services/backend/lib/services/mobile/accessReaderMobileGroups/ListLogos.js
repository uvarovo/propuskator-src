import Base from '../../Base';
import defaultLogosPaths from '../../../../etc/accessReaderMobileGroups/paths';

export default class ListDefaultLogos extends Base {
    static validationRules = {};

    async execute() {
        return {
            data : defaultLogosPaths
        };
    }
}
