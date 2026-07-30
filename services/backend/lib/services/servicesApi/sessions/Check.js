import Base          from '../../Base';
import { validateToken } from './utils';


export default class SessionCheck extends Base {
    static validationRules = {
        token : [ 'required', 'string' ]
    };

    async execute({ token }) {
        const tokenData = await validateToken(token);

        return {
            data : tokenData
        };
    }
}
