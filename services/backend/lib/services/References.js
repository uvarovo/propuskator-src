import referenceManager from '../models/referenceManager';
import ServiceBase      from './Base';

class References extends ServiceBase {
    static validationRules =  {
        name : [ 'string', { 'one_of': referenceManager.get_names() } ]
    }

    async execute({ name }) {
        if (name) {
            return { data: referenceManager.get(name) };
        }

        return referenceManager.get();
    }
}

export default References;
