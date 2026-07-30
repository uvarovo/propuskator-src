import ServiceBase from 'chista/ServiceBase';
import '../registerValidationRules.js';
import cls from '../cls';

class Base extends ServiceBase {
    constructor(args) {
        super(args);

        const context = this.context;

        context.lang = context.lang || 'ua';
        this.cls = cls;
    }
}

export default Base;
