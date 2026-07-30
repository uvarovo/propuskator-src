/* eslint-disable camelcase */

class ReferencesManager {
    constructor() {
        this.references = {};
    }

    set(label, value) {
        this.references[label] = value;
    }

    get_names() {
        return Object.keys(this.references);
    }

    get(name) {
        if (name) {
            return this.references[name];
        }

        return this.references;
    }
}

export default new ReferencesManager();
