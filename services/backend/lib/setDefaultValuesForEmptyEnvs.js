import fs     from 'fs';
import dotenv from 'dotenv';

/**
 * Sets the default values for environment variables that are exported but have empty('') value
 * @param {String} defaultEnvsFilePath - The path to file with defaults for environment variables
 */
function setDefaultValuesForEmptyEnvs(defaultEnvsFilePath = '/app/.env.defaults') {
    try {
        const envsFileBuffer = fs.readFileSync(defaultEnvsFilePath); // eslint-disable-line no-sync
        const envsDefaults = dotenv.parse(envsFileBuffer);

        Object
            .entries(process.env)
            .forEach(([ envName, envValue ]) => {
                if (envValue === '' && envsDefaults[envName]) process.env[envName] = envsDefaults[envName];
            });
    } catch (err) {
        console.error(err);
    }
}

setDefaultValuesForEmptyEnvs(process.env.DEFAULT_ENVS_FILE_PATH);
