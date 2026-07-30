/* eslint-disable camelcase */
import Jed from 'jed';

function missingKeyCallback(key) {
    console.error(key);
}

export default class Localizator {
    constructor(locales) {
        this.locales = {};
        Object.keys(locales).forEach(key => {
            this.locales[key] = new Jed({
                ...locales[key],
                missingKeyCallback
            });
        });
    }

    l(text, ctx) {
        if (!ctx || !this.locales[ctx]) return text;

        return this.locales[ctx].gettext(text);
    }
}
