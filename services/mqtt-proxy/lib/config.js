import path from 'path';
import confme from 'confme';

// ONLY works because babel transpile ESM to CJS module system
// when native ESM will be used here will be an error
const config = confme(
    path.join(__dirname, '../etc/config.json'),
    path.join(__dirname, '..', 'etc', 'config.validation.json')
);

export default config;
