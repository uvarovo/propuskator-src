import Base          from '../../Base';
import DX from '../../../models/utils/DX';
import { validateToken } from './utils';


export default class SessionsCheck extends Base {
    static validationRules = {
        token : [ 'required', 'string' ]
    };

    async execute({ token }) {
        try {
            const [ tokenData, user, accessSubject ] = await validateToken(token);

            return {
                user,
                tokenData,
                accessSubject
            };
        } catch (e) {
            if (e instanceof DX) {
                throw e;
            } else throw e;
        }
    }
}
