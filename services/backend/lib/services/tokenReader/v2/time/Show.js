import Base               from '../../../Base';
import Workspace from '../../../../models/Workspace';
import { getPosixStringForCurrentYear, getTimezoneInfoByName, convetToSupportedFormats } from '../../../utils/timezones';

export default class SessionsCheck extends Base {
    async execute() {
        try {
            const { timezone } = await Workspace.findOne({
                where : { id: this.cls.get('workspaceId') }
            });

            const d = new Date();
            const timestampminutes = Math.floor(d / 1000 / 60);
            // const timezonehoursoffset = -(new Date().getTimezoneOffset() / 60);
            const timestampseconds = Math.floor(d / 1000);

            return `${timestampminutes},${convetToSupportedFormats(getPosixStringForCurrentYear(getTimezoneInfoByName(timezone).utc[0]))},${timestampseconds}`;
        } catch (e) {
            throw e;
        }
    }
}
